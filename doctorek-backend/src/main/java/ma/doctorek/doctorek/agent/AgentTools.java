package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentCard;
import ma.doctorek.doctorek.agent.dto.CreneauxCarte;
import ma.doctorek.doctorek.agent.dto.CreneauxCompact;
import ma.doctorek.doctorek.agent.dto.MedecinCarte;
import ma.doctorek.doctorek.agent.dto.MedecinCompact;
import ma.doctorek.doctorek.agent.dto.RdvBrouillon;
import ma.doctorek.doctorek.agent.dto.RdvCompact;
import ma.doctorek.doctorek.dto.CreneauResponse;
import ma.doctorek.doctorek.dto.MedecinProfile;
import ma.doctorek.doctorek.dto.NoteMedecinResponse;
import ma.doctorek.doctorek.dto.PagedMedecinsResponse;
import ma.doctorek.doctorek.dto.RendezVousResponse;
import ma.doctorek.doctorek.service.AgendaService;
import ma.doctorek.doctorek.service.AnnuaireService;
import ma.doctorek.doctorek.service.AvisService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Outils exposés au modèle. <strong>Aucun n'écrit en base.</strong>
 *
 * <h2>Deux formes pour chaque résultat</h2>
 * Chaque outil produit deux choses à partir d'un unique appel au service métier :
 * <ul>
 *   <li>une <em>carte</em> déposée dans {@link AgentTurnContext}, riche, destinée à
 *       l'affichage — c'est la donnée réelle, elle ne passe pas par le modèle ;</li>
 *   <li>une <em>projection compacte</em>, valeur de retour de la méthode, qui entre
 *       dans le contexte du modèle et sert uniquement à sa prochaine décision.</li>
 * </ul>
 * Conséquence directe : le modèle ne peut pas inventer un praticien, une adresse
 * ou un horaire, puisqu'il n'écrit jamais ce que le patient voit. Et le prompt
 * reste petit, ce qui compte sur un palier gratuit facturé au jeton.
 *
 * <h2>Identité</h2>
 * Les outils qui touchent aux données du patient lisent son identifiant dans
 * {@link AgentTurnContext}, alimenté depuis le jeton Keycloak. Aucune signature
 * n'accepte d'identifiant patient : le modèle n'a pas de prise dessus.
 *
 * <h2>Erreurs</h2>
 * Une exception levée ici est convertie en message de résultat pour le modèle
 * (voir le processeur configuré dans {@link AgentConfig}), qui peut alors se
 * corriger — demander une ville, élargir les dates. Seul le dépassement du
 * plafond d'outils interrompt le tour.
 */
@Component
public class AgentTools {

    private static final String FORMAT_DATE_ATTENDU =
            "Format de date attendu : AAAA-MM-JJ (exemple 2026-08-18).";

    private final AnnuaireService annuaireService;
    private final AgendaService agendaService;
    private final AvisService avisService;
    private final AgentProperties properties;
    private final ZoneId zone;

    public AgentTools(AnnuaireService annuaireService,
                      AgendaService agendaService,
                      AvisService avisService,
                      AgentProperties properties,
                      ZoneId zoneApplication) {
        this.annuaireService = annuaireService;
        this.agendaService = agendaService;
        this.avisService = avisService;
        this.properties = properties;
        this.zone = zoneApplication;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Annuaire
    // ─────────────────────────────────────────────────────────────────────────

    @Tool(name = "rechercher_medecins",
          description = "Recherche des médecins par spécialité et/ou par ville. "
                  + "Au moins un des deux critères doit être renseigné. "
                  + "Renvoie les praticiens correspondants avec leur note moyenne, "
                  + "les mieux notés en premier et les profils sans avis en dernier.")
    public List<MedecinCompact> rechercherMedecins(
            @ToolParam(required = false, description = "Spécialité médicale, par exemple : cardiologie, dermatologie, pédiatrie")
            String specialite,
            @ToolParam(required = false, description = "Ville, par exemple : Casablanca, Rabat, Marrakech")
            String ville) {

        AgentTurnContext contexte = AgentTurnContext.courant();
        contexte.enregistrerAppel("rechercher_medecins");

        if (estVide(specialite) && estVide(ville)) {
            throw new IllegalArgumentException(
                    "Précisez au moins une spécialité ou une ville avant de lancer la recherche.");
        }

        PagedMedecinsResponse page = annuaireService.searchMedecins(
                normaliser(specialite), normaliser(ville), null, "all", 1, properties.getMaxResultatsRecherche());

        List<MedecinProfile> medecins = page.content();
        Map<UUID, NoteMedecinResponse> notes = notesPar(medecins.stream().map(MedecinProfile::id).toList());
        List<MedecinProfile> medecinsTries = medecins.stream()
                .sorted(Comparator.comparing(
                                (MedecinProfile medecin) -> noteMoyenne(notes.get(medecin.id())),
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(MedecinProfile::lastName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(MedecinProfile::firstName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        contexte.ajouterCarte(AgentCard.TYPE_MEDECINS, medecinsTries.stream()
                .map(m -> carte(m, notes.get(m.id()), null))
                .toList());

        return medecinsTries.stream()
                .map(m -> MedecinCompact.from(m, noteMoyenne(notes.get(m.id())), null))
                .toList();
    }

    @Tool(name = "medecins_a_proximite",
          description = "Recherche les médecins les plus proches de la position actuelle du patient, "
                  + "triés par distance. À utiliser quand le patient dit « près de moi », « autour de moi » "
                  + "ou « le plus proche », sans nommer de ville.")
    public List<MedecinCompact> medecinsAProximite(
            @ToolParam(required = false, description = "Spécialité médicale pour filtrer, par exemple : cardiologie")
            String specialite,
            @ToolParam(required = false, description = "Rayon de recherche en kilomètres, 20 par défaut, 50 au maximum")
            Integer rayonKm) {

        AgentTurnContext contexte = AgentTurnContext.courant();
        contexte.enregistrerAppel("medecins_a_proximite");

        double[] position = contexte.position().orElseThrow(() -> new IllegalStateException(
                "La position du patient n'est pas disponible. Demandez-lui d'activer la géolocalisation "
                        + "ou de préciser une ville, puis utilisez rechercher_medecins."));

        double rayon = rayonKm == null ? 20d : Math.min(Math.max(rayonKm, 1), 50);

        List<AnnuaireService.MedecinNearbyResult> resultats =
                annuaireService.searchNearby(position[0], position[1], rayon, normaliser(specialite))
                        .stream()
                        .limit(properties.getMaxResultatsRecherche())
                        .toList();

        Map<UUID, NoteMedecinResponse> notes =
                notesPar(resultats.stream().map(r -> r.medecin().id()).toList());

        contexte.ajouterCarte(AgentCard.TYPE_MEDECINS, resultats.stream()
                .map(r -> carte(r.medecin(), notes.get(r.medecin().id()), r.distanceKm()))
                .toList());

        return resultats.stream()
                .map(r -> MedecinCompact.from(
                        r.medecin(), noteMoyenne(notes.get(r.medecin().id())), r.distanceKm()))
                .toList();
    }

    @Tool(name = "profil_medecin",
          description = "Fiche détaillée d'un médecin à partir de son identifiant, "
                  + "obtenu par une recherche préalable.")
    public MedecinCompact profilMedecin(
            @ToolParam(description = "Identifiant du médecin (UUID) renvoyé par une recherche")
            String medecinId) {

        AgentTurnContext contexte = AgentTurnContext.courant();
        contexte.enregistrerAppel("profil_medecin");

        UUID id = parseUuid(medecinId);
        MedecinProfile profil = annuaireService.getMedecinProfile(id);
        NoteMedecinResponse note = notesPar(List.of(id)).get(id);

        contexte.ajouterCarte(AgentCard.TYPE_MEDECIN, carte(profil, note, null));
        return MedecinCompact.from(profil, noteMoyenne(note), null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Agenda
    // ─────────────────────────────────────────────────────────────────────────

    @Tool(name = "creneaux_medecin",
          description = "Créneaux libres d'un médecin sur une période. "
                  + "Couvre plusieurs jours en un seul appel : pour « cette semaine », "
                  + "utiliser nombreJours = 7 plutôt que sept appels successifs.")
    public List<CreneauxCompact> creneauxMedecin(
            @ToolParam(description = "Identifiant du médecin (UUID)")
            String medecinId,
            @ToolParam(description = "Premier jour exploré, au format AAAA-MM-JJ")
            String dateDebut,
            @ToolParam(required = false, description = "Nombre de jours à explorer à partir de dateDebut, 7 au maximum")
            Integer nombreJours) {

        AgentTurnContext contexte = AgentTurnContext.courant();
        contexte.enregistrerAppel("creneaux_medecin");

        UUID id = parseUuid(medecinId);
        LocalDate debut = parseDate(dateDebut);
        int jours = nombreJours == null
                ? properties.getMaxJoursCreneaux()
                : Math.min(Math.max(nombreJours, 1), properties.getMaxJoursCreneaux());

        MedecinProfile profil = annuaireService.getMedecinProfile(id);

        List<CreneauxCarte.JourCreneaux> pourLaCarte = new ArrayList<>();
        List<CreneauxCompact> pourLeModele = new ArrayList<>();

        for (int i = 0; i < jours; i++) {
            LocalDate jour = debut.plusDays(i);
            List<CreneauResponse> creneaux = agendaService.getCreneauxDisponibles(id, jour);
            if (creneaux.isEmpty()) {
                continue;
            }
            pourLaCarte.add(new CreneauxCarte.JourCreneaux(jour, creneaux));

            List<String> libres = creneaux.stream()
                    .filter(CreneauResponse::disponible)
                    .map(CreneauResponse::debut)
                    .toList();
            if (!libres.isEmpty()) {
                pourLeModele.add(new CreneauxCompact(jour, libres));
            }
        }

        contexte.ajouterCarte(AgentCard.TYPE_CRENEAUX, new CreneauxCarte(profil, pourLaCarte));
        return pourLeModele;
    }

    @Tool(name = "mes_rendez_vous",
          description = "Rendez-vous à venir du patient connecté. "
                  + "À utiliser pour « mes rendez-vous », « mon prochain rendez-vous », "
                  + "« quand est-ce que je vois le docteur ».")
    public List<RdvCompact> mesRendezVous() {

        AgentTurnContext contexte = AgentTurnContext.courant();
        contexte.enregistrerAppel("mes_rendez_vous");

        // L'identifiant vient du jeton, jamais du modèle : impossible de consulter l'agenda d'autrui.
        UUID patientId = contexte.patientId();
        LocalDate aujourdhui = LocalDate.now(zone);

        List<RendezVousResponse> aVenir = agendaService.getRdvsPatient(patientId).stream()
                .filter(rdv -> !"ANNULE".equals(rdv.statut()))
                .filter(rdv -> !rdv.dateRdv().isBefore(aujourdhui))
                .sorted(Comparator.comparing(RendezVousResponse::dateRdv)
                        .thenComparing(RendezVousResponse::heureRdv))
                .limit(10)
                .toList();

        contexte.ajouterCarte(AgentCard.TYPE_RDVS, aVenir);

        return aVenir.stream()
                .map(rdv -> new RdvCompact(
                        rdv.id(),
                        rdv.dateRdv(),
                        rdv.heureRdv(),
                        rdv.statut(),
                        nomMedecin(rdv.medecinId())))
                .toList();
    }

    @Tool(name = "preparer_rdv",
          description = "Prépare une proposition de rendez-vous et l'affiche au patient pour confirmation. "
                  + "N'enregistre RIEN : c'est le patient qui valide ensuite dans le formulaire de réservation. "
                  + "Après cet appel, inviter le patient à vérifier et confirmer.")
    public RdvBrouillon preparerRdv(
            @ToolParam(description = "Identifiant du médecin (UUID)")
            String medecinId,
            @ToolParam(description = "Date du rendez-vous, au format AAAA-MM-JJ")
            String date,
            @ToolParam(description = "Heure de début du créneau, au format HH:mm, telle que renvoyée par creneaux_medecin")
            String heure,
            @ToolParam(required = false, description = "Motif de consultation exprimé par le patient, en une phrase")
            String motif) {

        AgentTurnContext contexte = AgentTurnContext.courant();
        contexte.enregistrerAppel("preparer_rdv");

        UUID id = parseUuid(medecinId);
        LocalDate jour = parseDate(date);
        LocalTime debut = parseHeure(heure);

        MedecinProfile profil = annuaireService.getMedecinProfile(id);
        String nom = nomComplet(profil);

        // Le créneau est revérifié ici : entre la réponse précédente et celle-ci,
        // un autre patient a pu le prendre.
        CreneauResponse creneau = agendaService.getCreneauxDisponibles(id, jour).stream()
                .filter(c -> debut.equals(parseHeure(c.debut())))
                .findFirst()
                .orElse(null);

        RdvBrouillon brouillon;
        if (creneau == null) {
            brouillon = RdvBrouillon.indisponible(id, nom, jour, debut,
                    "Ce créneau ne figure pas dans l'agenda du praticien.");
        } else if (!creneau.disponible()) {
            brouillon = RdvBrouillon.indisponible(id, nom, jour, debut,
                    "Ce créneau vient d'être réservé.");
        } else {
            int duree = (int) ChronoUnit.MINUTES.between(debut, parseHeure(creneau.fin()));
            brouillon = new RdvBrouillon(id, nom, contexte.patientId(), jour, debut, duree,
                    normaliser(motif), true, null);
        }

        contexte.ajouterCarte(AgentCard.TYPE_BROUILLON, brouillon);
        return brouillon;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utilitaires
    // ─────────────────────────────────────────────────────────────────────────

    private Map<UUID, NoteMedecinResponse> notesPar(List<UUID> medecinIds) {
        if (medecinIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, NoteMedecinResponse> parId = new HashMap<>();
        for (NoteMedecinResponse note : avisService.notesParMedecins(medecinIds)) {
            parId.put(note.medecinId(), note);
        }
        return parId;
    }

    private MedecinCarte carte(MedecinProfile profil, NoteMedecinResponse note, Double distanceKm) {
        return new MedecinCarte(
                profil,
                note == null ? null : note.noteMoyenne(),
                note == null ? null : note.nombreAvis(),
                distanceKm);
    }

    private Double noteMoyenne(NoteMedecinResponse note) {
        return note == null ? null : note.noteMoyenne();
    }

    private String nomMedecin(UUID medecinId) {
        return nomComplet(annuaireService.getMedecinProfile(medecinId));
    }

    private static String nomComplet(MedecinProfile profil) {
        return "Dr " + profil.firstName() + " " + profil.lastName();
    }

    private static boolean estVide(String valeur) {
        return valeur == null || valeur.isBlank();
    }

    private static String normaliser(String valeur) {
        return estVide(valeur) ? null : valeur.trim();
    }

    private static UUID parseUuid(String valeur) {
        try {
            return UUID.fromString(valeur.trim());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException(
                    "Identifiant de médecin invalide. Utilisez celui renvoyé par une recherche.");
        }
    }

    private static LocalDate parseDate(String valeur) {
        try {
            return LocalDate.parse(valeur.trim());
        } catch (DateTimeParseException | NullPointerException e) {
            throw new IllegalArgumentException(FORMAT_DATE_ATTENDU);
        }
    }

    private static LocalTime parseHeure(String valeur) {
        try {
            return LocalTime.parse(valeur.trim());
        } catch (DateTimeParseException | NullPointerException e) {
            throw new IllegalArgumentException("Format d'heure attendu : HH:mm (exemple 14:30).");
        }
    }
}
