package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.CreerRdvMedecinRequest;
import ma.doctorek.doctorek.dto.CreerRdvMedecinResponse;
import ma.doctorek.doctorek.dto.CreneauResponse;
import ma.doctorek.doctorek.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.dto.DisponibiliteResponse;
import ma.doctorek.doctorek.dto.PatientSummaryResponse;
import ma.doctorek.doctorek.dto.PatientsPageResponse;
import ma.doctorek.doctorek.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.dto.RendezVousResponse;
import ma.doctorek.doctorek.entity.DisponibiliteEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.PatientNotFoundException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.util.Noms;
import ma.doctorek.doctorek.enums.FrequenceDisponibilite;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.enums.TypeFinRecurrence;
import ma.doctorek.doctorek.exception.CreneauIndisponibleException;
import ma.doctorek.doctorek.exception.DisponibiliteNotFoundException;
import ma.doctorek.doctorek.exception.MedecinSansAgendaException;
import ma.doctorek.doctorek.exception.RdvNonAnnulableException;
import ma.doctorek.doctorek.exception.RdvNonConfirmableException;
import ma.doctorek.doctorek.exception.RdvNonTerminableException;
import ma.doctorek.doctorek.exception.RendezVousNotFoundException;
import ma.doctorek.doctorek.repository.DisponibiliteRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.PatientSummaryProjection;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AgendaService {

    private static final Logger log = LoggerFactory.getLogger(AgendaService.class);

    private static final int DUREE_DEFAUT_MIN = 30;

    private final DisponibiliteRepository dispoRepo;
    private final RendezVousRepository    rdvRepo;
    private final UserRepository          userRepo;
    private final PatientRepository       patientRepo;
    private final EmailService            emailService;
    private final QuestionnaireSerializer questionnaireSerializer;
    private final AccesPatientService     accesPatientService;
    private final NotificationRoutingService notificationRouting;
    private final RattachementService     rattachementService;
    private final PatientPivotService     patientPivotService;
    private final NotificationService     notificationService;
    private final String frontendUrl;

    public AgendaService(DisponibiliteRepository dispoRepo,
                          RendezVousRepository rdvRepo,
                          UserRepository userRepo,
                          PatientRepository patientRepo,
                          EmailService emailService,
                          QuestionnaireSerializer questionnaireSerializer,
                          AccesPatientService accesPatientService,
                          NotificationRoutingService notificationRouting,
                          RattachementService rattachementService,
                          PatientPivotService patientPivotService,
                          NotificationService notificationService,
                          @Value("${app.frontend-url}") String frontendUrl) {
        this.dispoRepo = dispoRepo;
        this.rdvRepo = rdvRepo;
        this.userRepo = userRepo;
        this.patientRepo = patientRepo;
        this.emailService = emailService;
        this.questionnaireSerializer = questionnaireSerializer;
        this.accesPatientService = accesPatientService;
        this.notificationRouting = notificationRouting;
        this.rattachementService = rattachementService;
        this.patientPivotService = patientPivotService;
        this.notificationService = notificationService;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    @CacheEvict(value = "creneaux", allEntries = true)
    public DisponibiliteResponse defineDisponibilite(UUID medecinId, DefineDisponibiliteRequest req) {
        if (!req.heureDebut().isBefore(req.heureFin())) {
            throw new IllegalArgumentException(
                "L'heure de début doit être antérieure à l'heure de fin");
        }

        String jour = req.jourSemaine().name();
        List<DisponibiliteEntity> existing = dispoRepo.findAllByMedecinIdAndJourSemaine(medecinId, jour);
        for (DisponibiliteEntity dispo : existing) {
            boolean exactMatch = req.heureDebut().equals(dispo.getHeureDebut())
                              && req.heureFin().equals(dispo.getHeureFin());
            if (exactMatch) {
                return DisponibiliteResponse.from(dispo);
            }
            boolean overlaps = req.heureDebut().isBefore(dispo.getHeureFin())
                            && req.heureFin().isAfter(dispo.getHeureDebut());
            if (overlaps) {
                dispoRepo.deleteById(dispo.getId());
            }
        }

        FrequenceDisponibilite frequence = req.frequence() != null
            ? req.frequence()
            : FrequenceDisponibilite.TOUTES_LES_SEMAINES;

        int intervalSemaines = (req.intervalSemaines() != null && req.intervalSemaines() > 0)
            ? req.intervalSemaines()
            : 1;

        LocalDate dateDebut = req.dateDebut() != null ? req.dateDebut() : LocalDate.now();

        TypeFinRecurrence typeFinRecurrence = req.typeFinRecurrence() != null
            ? req.typeFinRecurrence()
            : TypeFinRecurrence.JAMAIS;

        DisponibiliteEntity dispo = new DisponibiliteEntity();
        dispo.setMedecinId(medecinId);
        dispo.setJourSemaine(jour);
        dispo.setHeureDebut(req.heureDebut());
        dispo.setHeureFin(req.heureFin());
        dispo.setDureeConsultation(req.dureeConsultation());
        dispo.setFrequence(frequence.name());
        dispo.setIntervalSemaines(intervalSemaines);
        dispo.setDateDebut(dateDebut);
        dispo.setTypeFinRecurrence(typeFinRecurrence.name());
        dispo.setDateFin(req.dateFin());
        return DisponibiliteResponse.from(dispoRepo.save(dispo));
    }

    @Transactional
    @CacheEvict(value = "creneaux", allEntries = true)
    public void deleteDisponibilite(UUID medecinId, UUID dispoId) {
        DisponibiliteEntity dispo = dispoRepo.findById(dispoId)
            .orElseThrow(() -> new DisponibiliteNotFoundException(dispoId));

        if (!dispo.getMedecinId().equals(medecinId)) {
            throw new IllegalArgumentException(
                "Cette disponibilité n'appartient pas au médecin indiqué");
        }
        dispoRepo.deleteById(dispoId);
    }

    @Transactional(readOnly = true)
    public List<DisponibiliteResponse> getDisponibilites(UUID medecinId) {
        return dispoRepo.findByMedecinId(medecinId).stream()
            .map(DisponibiliteResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "creneaux", key = "#medecinId + ':' + #date")
    public List<CreneauResponse> getCreneauxDisponibles(UUID medecinId, LocalDate date) {
        List<DisponibiliteEntity> dispos = dispoRepo.findAllByMedecinIdAndJourSemaine(
            medecinId, date.getDayOfWeek().name());
        if (dispos.isEmpty()) return List.of();

        Set<LocalTime> heuresPrises = rdvRepo.findByMedecinIdAndDateRdv(medecinId, date)
            .stream()
            .filter(r -> !StatutRdv.ANNULE.name().equals(r.getStatut()))
            .map(RendezVousEntity::getHeureRdv)
            .collect(Collectors.toSet());

        List<CreneauResponse> creneaux = new ArrayList<>();
        for (DisponibiliteEntity dispo : dispos) {
            LocalTime current = dispo.getHeureDebut();
            int duree = dispo.getDureeConsultation();
            if (duree <= 0) continue;

            while (true) {
                LocalTime fin = current.plusMinutes(duree);
                if (fin.isBefore(current) && fin != LocalTime.MIDNIGHT) break;
                if (fin.isAfter(dispo.getHeureFin()) && fin != LocalTime.MIDNIGHT) break;

                boolean libre = !heuresPrises.contains(current);
                creneaux.add(new CreneauResponse(current.toString(), fin.toString(), libre));
                current = fin;
                if (current.equals(LocalTime.MIDNIGHT) || current.equals(dispo.getHeureFin())) break;
            }
        }
        creneaux.sort(Comparator.comparing(CreneauResponse::debut));
        return creneaux;
    }

    @Transactional
    @CacheEvict(value = "creneaux", allEntries = true)
    public RendezVousResponse prendreRdv(PrendreRdvRequest request, UUID requesterUserId) {
        // Compte famille : on ne peut réserver que pour soi-même ou un proche géré
        accesPatientService.verifierAcces(requesterUserId, request.patientId());

        DisponibiliteEntity dispo = dispoRepo
            .findByMedecinIdAndJourSemaine(request.medecinId(), request.dateRdv().getDayOfWeek().name())
            .orElseThrow(() -> new MedecinSansAgendaException(request.medecinId()));

        if (rdvRepo.existsByMedecinIdAndDateRdvAndHeureRdv(
                request.medecinId(), request.dateRdv(), request.heureRdv())) {
            throw new CreneauIndisponibleException(
                "Créneau indisponible : " + request.dateRdv() + " à " + request.heureRdv());
        }

        String questionnaireJson = questionnaireSerializer.serialize(request.questionnaire());

        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setMedecinId(request.medecinId());
        rdv.setPatientId(request.patientId());
        rdv.setDateRdv(request.dateRdv());
        rdv.setHeureRdv(request.heureRdv());
        rdv.setDuree(dispo.getDureeConsultation());
        rdv.setStatut(StatutRdv.CONFIRME.name()); // auto-confirmed — doctor manages via cancel only
        rdv.setMotif(request.motif());
        rdv.setQuestionnaireJson(questionnaireJson);
        rdv.setCreePar(requesterUserId);
        rdv.setCreatedAt(LocalDateTime.now());

        RendezVousEntity saved = rdvRepo.save(rdv);

        // Routage famille : majeur avec email → le patient ; mineur/sans email → le gestionnaire
        notificationRouting.resolveEmail(saved.getPatientId()).ifPresentOrElse(
            email -> emailService.sendConfirmationRdv(email, saved),
            () -> log.warn("Aucun destinataire pour rdv {} — confirmation email non envoyée", saved.getId())
        );

        notifierMedecinNouveauRdv(saved, requesterUserId);

        return RendezVousResponse.from(saved);
    }

    /**
     * Création d'un RDV par le praticien lui-même — patient existant ou créé
     * à la volée (sans compte). Si le patient est rattachable (email, pas de
     * compte, pas de gestionnaire), il reçoit un lien de rattachement.
     */
    @Transactional
    @CacheEvict(value = "creneaux", allEntries = true)
    public CreerRdvMedecinResponse creerRdvParMedecin(UUID medecinId, CreerRdvMedecinRequest request) {
        if ((request.patientId() == null) == (request.nouveauPatient() == null)) {
            throw new IllegalArgumentException(
                "Renseignez soit un patient existant, soit un nouveau patient (exactement un des deux)");
        }

        PatientEntity patient;
        if (request.patientId() != null) {
            patient = patientRepo.findById(request.patientId())
                .orElseThrow(() -> new PatientNotFoundException(request.patientId()));
        } else {
            patient = resoudreOuCreerPatient(request.nouveauPatient());
        }

        if (rdvRepo.existsByMedecinIdAndDateRdvAndHeureRdv(medecinId, request.dateRdv(), request.heureRdv())) {
            throw new CreneauIndisponibleException(
                "Créneau indisponible : " + request.dateRdv() + " à " + request.heureRdv());
        }

        // Le médecin peut créer hors de ses disponibilités : durée par défaut alors
        int duree = dispoRepo
            .findByMedecinIdAndJourSemaine(medecinId, request.dateRdv().getDayOfWeek().name())
            .map(DisponibiliteEntity::getDureeConsultation)
            .orElse(DUREE_DEFAUT_MIN);

        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setMedecinId(medecinId);
        rdv.setPatientId(patient.getId());
        rdv.setDateRdv(request.dateRdv());
        rdv.setHeureRdv(request.heureRdv());
        rdv.setDuree(duree);
        rdv.setStatut(StatutRdv.CONFIRME.name());
        rdv.setMotif(request.motif());
        rdv.setCreePar(medecinId);
        rdv.setCreatedAt(LocalDateTime.now());
        RendezVousEntity saved = rdvRepo.save(rdv);

        String medecinNom = userRepo.findById(medecinId)
            .map(m -> "Dr. " + m.getFirstName() + " " + m.getLastName())
            .orElse("Votre médecin");

        boolean emailRattachement = rattachementService.creerTokenSiEligible(patient, saved.getId())
            .map(token -> {
                String lien = frontendUrl + "/rattacher/" + token.getToken();
                emailService.sendRdvCreeParMedecin(patient.getEmail(), saved, medecinNom, lien);
                return true;
            })
            .orElseGet(() -> {
                // Patient déjà rattaché ou avec compte : email standard + notif in-app
                // (vers son compte s'il en a un, sinon vers son gestionnaire)
                notificationRouting.resolveEmail(patient.getId()).ifPresent(email ->
                    emailService.sendConfirmationRdv(email, saved));
                notificationRouting.resolveCompteUserId(patient.getId()).ifPresent(userId ->
                    notificationService.push(userId, "RDV_CREE_MEDECIN",
                        "Nouveau rendez-vous créé par " + medecinNom,
                        medecinNom + " a créé un rendez-vous pour " + patient.getPrenom()
                            + " le " + saved.getDateRdv() + " à " + saved.getHeureRdv() + "."));
                return false;
            });

        return new CreerRdvMedecinResponse(
            RendezVousResponse.from(saved, patient.getPrenom(), patient.getNom()),
            emailRattachement);
    }

    /**
     * Nouveau patient saisi par le cabinet : si l'email ET le nom/prénom
     * correspondent à un compte existant, le RDV est lié directement à ce
     * compte (visible dans son espace, notifié) au lieu de créer un doublon.
     * Si l'email appartient à quelqu'un d'autre (parent d'un mineur, aidant…),
     * on crée bien une fiche séparée — le lien de rattachement fera le pont.
     */
    private PatientEntity resoudreOuCreerPatient(CreerRdvMedecinRequest.NouveauPatient nouveau) {
        String email = nouveau.email() == null || nouveau.email().isBlank() ? null : nouveau.email().trim();

        if (email != null) {
            var existant = userRepo.findByEmail(email)
                .filter(u -> Noms.identiques(u.getLastName(), nouveau.nom())
                          && Noms.identiques(u.getFirstName(), nouveau.prenom()))
                .map(u -> patientPivotService.getOrCreateSelf(u.getId()));
            if (existant.isPresent()) {
                log.info("RDV médecin lié directement au compte existant {}", existant.get().getId());
                return existant.get();
            }
        }

        PatientEntity entity = new PatientEntity(
            nouveau.nom().trim(), nouveau.prenom().trim(), nouveau.dateNaissance());
        entity.setEmail(email);
        entity.setTelephone(nouveau.telephone());
        return patientRepo.save(entity);
    }

    @Transactional(readOnly = true)
    public List<RendezVousResponse> getRdvsPatient(UUID patientId) {
        return rdvRepo.findByPatientId(patientId, PageRequest.of(0, 200))
            .getContent().stream()
            .map(RendezVousResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<RendezVousResponse> getRdvsMedecin(UUID medecinId) {
        List<RendezVousEntity> rdvs = rdvRepo.findByMedecinId(medecinId, PageRequest.of(0, 500)).getContent();

        // Le médecin doit distinguer « le patient a réservé » de « un proche a réservé pour
        // lui ». On ne résout donc que les auteurs tiers, en une requête pour toute la liste.
        Set<UUID> auteursTiers = rdvs.stream()
            .map(RendezVousEntity::getCreePar)
            .filter(java.util.Objects::nonNull)
            .collect(Collectors.toSet());
        rdvs.forEach(r -> {
            if (r.getCreePar() != null && r.getCreePar().equals(r.getPatientId())) {
                auteursTiers.remove(r.getCreePar());
            }
        });
        Map<UUID, String> nomsAuteurs = auteursTiers.isEmpty() ? Map.of()
            : userRepo.findAllById(auteursTiers).stream()
                .collect(Collectors.toMap(User::getId, u -> u.getFirstName() + " " + u.getLastName()));

        return rdvs.stream()
            .map(rdv -> {
                String auteur = rdv.getCreePar() == null || rdv.getCreePar().equals(rdv.getPatientId())
                    ? null
                    : nomsAuteurs.get(rdv.getCreePar());
                return patientRepo.findById(rdv.getPatientId())
                    .map(p -> RendezVousResponse.from(rdv, p.getPrenom(), p.getNom(), auteur))
                    .orElseGet(() -> RendezVousResponse.from(rdv, null, null, auteur));
            })
            .toList();
    }

    @Transactional
    @CacheEvict(value = "creneaux", allEntries = true)
    /**
     * Annule un rendez-vous après avoir vérifié que l'appelant en a le droit.
     *
     * <p>Le praticien concerné, le patient lui-même ou le titulaire qui gère ce
     * patient peuvent annuler. Sans ce contrôle, connaître un identifiant suffisait
     * à annuler le rendez-vous d'autrui.
     */
    public RendezVousResponse annulerRdv(UUID rdvId, UUID requesterUserId) {
        RendezVousEntity rdv = rdvRepo.findById(rdvId)
            .orElseThrow(() -> new RendezVousNotFoundException(rdvId));

        if (!rdv.getMedecinId().equals(requesterUserId)) {
            accesPatientService.verifierAcces(requesterUserId, rdv.getPatientId());
        }

        StatutRdv statut = StatutRdv.valueOf(rdv.getStatut());
        if (statut == StatutRdv.ANNULE || statut == StatutRdv.TERMINE) {
            throw new RdvNonAnnulableException(rdvId, statut);
        }
        rdv.setStatut(StatutRdv.ANNULE.name());
        RendezVousEntity saved = rdvRepo.save(rdv);

        // Le médecin doit voir le créneau se libérer sans rafraîchir son agenda.
        if (!rdv.getMedecinId().equals(requesterUserId)) {
            try {
                notificationService.push(saved.getMedecinId(), "RDV_ANNULE_PATIENT",
                    "Rendez-vous annulé",
                    "Le rendez-vous du " + saved.getDateRdv() + " à " + saved.getHeureRdv()
                        + " a été annulé.");
            } catch (Exception e) {
                log.warn("Notification d'annulation non envoyée pour le rdv {} : {}", rdvId, e.getMessage());
            }
        }
        return RendezVousResponse.from(saved);
    }

    /**
     * Prévient le praticien qu'un rendez-vous vient d'être pris dans son agenda.
     *
     * <p>Précise le cas échéant que la réservation a été faite par un tiers pour un
     * proche : sans cette mention, le médecin lit le nom du patient et suppose que
     * c'est lui qui a réservé.
     */
    private void notifierMedecinNouveauRdv(RendezVousEntity rdv, UUID auteurId) {
        String patientNom = patientRepo.findById(rdv.getPatientId())
            .map(p -> p.getPrenom() + " " + p.getNom())
            .orElse("un patient");

        boolean pourUnProche = auteurId != null && !auteurId.equals(rdv.getPatientId());
        String corps = pourUnProche
            ? nomDuCompte(auteurId) + " a réservé pour " + patientNom
                + " le " + rdv.getDateRdv() + " à " + rdv.getHeureRdv() + "."
            : patientNom + " a réservé le " + rdv.getDateRdv() + " à " + rdv.getHeureRdv() + ".";

        try {
            notificationService.push(rdv.getMedecinId(), "RDV_PRIS_PATIENT",
                "Nouveau rendez-vous", corps);
        } catch (Exception e) {
            // La notification ne doit jamais faire échouer la réservation elle-même.
            log.warn("Notification médecin non envoyée pour le rdv {} : {}", rdv.getId(), e.getMessage());
        }
    }

    private String nomDuCompte(UUID userId) {
        return userRepo.findById(userId)
            .map(u -> u.getFirstName() + " " + u.getLastName())
            .orElse("Un proche");
    }


    @Transactional
    public RendezVousResponse confirmerRdv(UUID rdvId) {
        RendezVousEntity rdv = rdvRepo.findById(rdvId)
            .orElseThrow(() -> new RendezVousNotFoundException(rdvId));
        StatutRdv statut = StatutRdv.valueOf(rdv.getStatut());
        if (statut == StatutRdv.ANNULE || statut == StatutRdv.TERMINE) {
            throw new RdvNonConfirmableException(rdvId, statut);
        }
        rdv.setStatut(StatutRdv.CONFIRME.name());
        RendezVousEntity saved = rdvRepo.save(rdv);

        // Email au patient : son médecin vient de confirmer le rendez-vous
        String medecinNom = userRepo.findById(saved.getMedecinId())
            .map(m -> "Dr. " + m.getFirstName() + " " + m.getLastName())
            .orElse("Votre médecin");
        notificationRouting.resolveEmail(saved.getPatientId()).ifPresent(
            email -> emailService.sendRdvConfirmeParMedecin(email, saved, medecinNom));

        return RendezVousResponse.from(saved);
    }

    @Transactional
    public RendezVousResponse terminerRdv(UUID rdvId) {
        RendezVousEntity rdv = rdvRepo.findById(rdvId)
            .orElseThrow(() -> new RendezVousNotFoundException(rdvId));
        StatutRdv statut = StatutRdv.valueOf(rdv.getStatut());
        if (statut != StatutRdv.CONFIRME) {
            throw new RdvNonTerminableException(rdvId, statut);
        }
        rdv.setStatut(StatutRdv.TERMINE.name());
        return RendezVousResponse.from(rdvRepo.save(rdv));
    }

    @Transactional
    @CacheEvict(value = "creneaux", allEntries = true)
    public RendezVousResponse reprogrammerRdv(UUID id, LocalDate newDate, LocalTime newHeure) {
        RendezVousEntity rdv = rdvRepo.findById(id)
            .orElseThrow(() -> new RendezVousNotFoundException(id));

        boolean slotTaken = rdvRepo.findByMedecinIdAndDateRdv(rdv.getMedecinId(), newDate)
            .stream()
            .anyMatch(r -> r.getHeureRdv().equals(newHeure) && !r.getId().equals(id));
        if (slotTaken) {
            throw new IllegalStateException("Ce créneau est déjà pris");
        }

        rdv.setDateRdv(newDate);
        rdv.setHeureRdv(newHeure);
        return RendezVousResponse.from(rdvRepo.save(rdv));
    }

    @Transactional(readOnly = true)
    public PatientsPageResponse getPatientsMedecin(UUID medecinId, String search, String filtre, int page, int size) {
        String s = search == null ? "" : search.trim();
        String f = filtre == null || filtre.isBlank() ? "TOUS" : filtre.toUpperCase();

        List<PatientSummaryProjection> projections = rdvRepo.findPatientsByMedecinId(
            medecinId, s, f, size, page * size);

        List<PatientSummaryResponse> patients = projections.stream()
            .map(p -> new PatientSummaryResponse(
                UUID.fromString(p.getPatientId()),
                p.getFirstName(),
                p.getLastName(),
                p.getPhotoUrl(),
                p.getDernierRdvDate(),
                p.getDernierRdvStatut() != null ? StatutRdv.valueOf(p.getDernierRdvStatut()) : null,
                p.isHasFutureRdv()))
            .toList();

        long total = rdvRepo.countPatientsByMedecinId(medecinId, s, f);
        return new PatientsPageResponse(patients, total, page, size);
    }
}
