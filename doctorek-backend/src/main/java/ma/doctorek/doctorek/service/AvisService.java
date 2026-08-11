package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.AvisPageResponse;
import ma.doctorek.doctorek.dto.AvisResponse;
import ma.doctorek.doctorek.dto.CreerAvisRequest;
import ma.doctorek.doctorek.dto.NoteMedecinResponse;
import ma.doctorek.doctorek.dto.SignalerAvisRequest;
import ma.doctorek.doctorek.entity.AvisEntity;
import ma.doctorek.doctorek.entity.AvisSignalementEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.enums.StatutAvis;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.exception.AvisInvalideException;
import ma.doctorek.doctorek.exception.AvisNotFoundException;
import ma.doctorek.doctorek.repository.AvisProjection;
import ma.doctorek.doctorek.repository.AvisRepository;
import ma.doctorek.doctorek.repository.AvisSignalementRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.RepartitionNotesProjection;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Avis des patients sur leurs médecins.
 *
 * <p>Règle unique dont tout le reste découle : un avis n'existe que s'il est adossé à un
 * rendez-vous terminé appartenant à l'auteur. Le client n'envoie donc jamais le médecin
 * ni le patient — ils se déduisent du rendez-vous, sans quoi n'importe quel compte
 * pourrait noter n'importe quel praticien.
 */
@Service
public class AvisService {

    private static final int NOTE_MIN = 1;
    private static final int NOTE_MAX = 5;
    /** Borne le lot de notes demandé en une requête : une page de résultats, pas l'annuaire entier. */
    private static final int MAX_MEDECINS_PAR_LOT = 60;
    /** Message unique pour les trois refus : détailler révélerait les rendez-vous d'autrui. */
    private static final String REFUS = "Cette consultation ne peut pas être notée.";

    private final AvisRepository avisRepo;
    private final AvisSignalementRepository signalementRepo;
    private final RendezVousRepository rdvRepo;
    private final PatientRepository patientRepo;
    private final UserRepository userRepo;

    public AvisService(AvisRepository avisRepo,
                       AvisSignalementRepository signalementRepo,
                       RendezVousRepository rdvRepo,
                       PatientRepository patientRepo,
                       UserRepository userRepo) {
        this.avisRepo = avisRepo;
        this.signalementRepo = signalementRepo;
        this.rdvRepo = rdvRepo;
        this.patientRepo = patientRepo;
        this.userRepo = userRepo;
    }

    // ── Dépôt ──────────────────────────────────────────────────────────────

    @Transactional
    public AvisResponse creerAvis(UUID compteId, CreerAvisRequest request) {
        int note = request.note() == null ? 0 : request.note();
        if (note < NOTE_MIN || note > NOTE_MAX) {
            throw new AvisInvalideException("La note doit être comprise entre 1 et 5.");
        }

        PatientEntity patient = patientRepo.findByCompteId(compteId)
            .orElseThrow(() -> new AvisInvalideException(REFUS));

        RendezVousEntity rdv = rdvRepo.findById(request.rdvId())
            .orElseThrow(() -> new AvisInvalideException(REFUS));

        if (!rdv.getPatientId().equals(patient.getId())) throw new AvisInvalideException(REFUS);
        if (!StatutRdv.TERMINE.name().equals(rdv.getStatut())) throw new AvisInvalideException(REFUS);
        if (avisRepo.existsByRdvId(rdv.getId())) {
            throw new AvisInvalideException("Cette consultation a déjà reçu votre avis.");
        }

        AvisEntity avis = AvisEntity.builder()
            .medecinId(rdv.getMedecinId())
            .patientId(patient.getId())
            .rdvId(rdv.getId())
            .note((short) note)
            .commentaire(normaliser(request.commentaire()))
            .anonyme(request.anonyme())
            .statut(StatutAvis.PUBLIE.name())
            .build();

        AvisEntity saved = enregistrer(avis);
        return AvisResponse.from(saved, patient.getPrenom(), patient.getNom());
    }

    /**
     * L'index unique reste le seul arbitre réel : la vérification ci-dessus lit puis insère,
     * deux envois simultanés la franchiraient tous les deux.
     */
    private AvisEntity enregistrer(AvisEntity avis) {
        try {
            return avisRepo.save(avis);
        } catch (DataIntegrityViolationException e) {
            throw new AvisInvalideException("Cette consultation a déjà reçu votre avis.");
        }
    }

    private static String normaliser(String texte) {
        if (texte == null) return null;
        String trim = texte.trim();
        return trim.isEmpty() ? null : trim;
    }

    // ── Éligibilité ────────────────────────────────────────────────────────

    /**
     * Parmi des rendez-vous affichés au patient, ceux qu'il peut encore noter.
     *
     * <p>Sert uniquement à décider de l'affichage du bouton : l'éligibilité est
     * revérifiée au dépôt, où elle fait autorité.
     */
    @Transactional(readOnly = true)
    public List<UUID> filtrerRdvsNotables(UUID compteId, Collection<UUID> candidats) {
        if (candidats == null || candidats.isEmpty()) return List.of();

        UUID patientId = patientRepo.findByCompteId(compteId)
            .map(PatientEntity::getId)
            .orElse(null);
        if (patientId == null) return List.of();

        Set<UUID> dejaNotes = new HashSet<>(avisRepo.findRdvIdsNotes(List.of(patientId)));

        List<UUID> notables = new ArrayList<>();
        for (RendezVousEntity rdv : rdvRepo.findAllById(candidats)) {
            boolean notable = StatutRdv.TERMINE.name().equals(rdv.getStatut())
                && patientId.equals(rdv.getPatientId())
                && !dejaNotes.contains(rdv.getId());
            if (notable) notables.add(rdv.getId());
        }
        return notables;
    }

    // ── Lecture publique ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AvisPageResponse listerAvisMedecin(UUID medecinId, int page, int size) {
        Page<AvisProjection> resultats =
            avisRepo.findPubliesByMedecinId(medecinId, PageRequest.of(Math.max(page - 1, 0), size));

        return new AvisPageResponse(
            resultats.getContent().stream().map(AvisResponse::from).toList(),
            resultats.getTotalElements(),
            resultats.getTotalPages(),
            page,
            size,
            calculerNoteMoyenne(medecinId),
            resultats.getTotalElements(),
            calculerRepartition(medecinId));
    }

    /** Moyenne arrondie au dixième, ou {@code null} si le médecin n'a aucun avis. */
    @Transactional(readOnly = true)
    public Double noteMoyenne(UUID medecinId) {
        return calculerNoteMoyenne(medecinId);
    }

    // Le calcul est séparé de la méthode transactionnelle : l'appeler depuis cette même
    // classe court-circuiterait le proxy Spring, et la transaction annoncée n'existerait pas.
    private Double calculerNoteMoyenne(UUID medecinId) {
        Double moyenne = avisRepo.moyenneParMedecin(medecinId);
        return moyenne == null ? null : Math.round(moyenne * 10) / 10.0;
    }

    @Transactional(readOnly = true)
    public long nombreAvis(UUID medecinId) {
        return avisRepo.countByMedecinIdAndStatutNot(medecinId, StatutAvis.MASQUE.name());
    }

    /**
     * Notes de plusieurs médecins, pour les cartes d'une page de résultats.
     *
     * <p>Une seule requête pour toute la page : une par carte multiplierait les allers-retours
     * au rythme de la pagination. Les médecins sans avis sont absents de la réponse plutôt que
     * renvoyés à zéro.
     */
    @Transactional(readOnly = true)
    public List<NoteMedecinResponse> notesParMedecins(Collection<UUID> medecinIds) {
        if (medecinIds == null || medecinIds.isEmpty()) return List.of();
        if (medecinIds.size() > MAX_MEDECINS_PAR_LOT) {
            throw new AvisInvalideException(
                "Trop de médecins demandés en une fois (maximum " + MAX_MEDECINS_PAR_LOT + ").");
        }

        return avisRepo.notesParMedecins(medecinIds).stream()
            .map(ligne -> new NoteMedecinResponse(
                ligne.getMedecinId(),
                Math.round(ligne.getMoyenne() * 10) / 10.0,
                ligne.getTotal()))
            .toList();
    }

    /** Histogramme des notes, de 1 à 5 : les valeurs jamais attribuées valent 0. */
    @Transactional(readOnly = true)
    public List<Integer> repartition(UUID medecinId) {
        return calculerRepartition(medecinId);
    }

    private List<Integer> calculerRepartition(UUID medecinId) {
        int[] compteurs = new int[NOTE_MAX];
        for (RepartitionNotesProjection ligne : avisRepo.repartitionParMedecin(medecinId)) {
            int index = ligne.getNote() - 1;
            if (index >= 0 && index < NOTE_MAX) compteurs[index] = (int) ligne.getTotal();
        }
        List<Integer> repartition = new ArrayList<>(NOTE_MAX);
        for (int c : compteurs) repartition.add(c);
        return repartition;
    }

    // ── Signalement ────────────────────────────────────────────────────────

    /**
     * Signale un avis.
     *
     * <p>Le signalement ne dépublie pas : il place l'avis en file de modération. Retirer
     * automatiquement suffirait à faire taire n'importe quel avis négatif.
     */
    @Transactional
    public void signaler(UUID avisId, UUID compteId, SignalerAvisRequest request) {
        AvisEntity avis = avisRepo.findById(avisId)
            .orElseThrow(() -> new AvisNotFoundException(avisId));

        if (signalementRepo.existsByAvisIdAndAuteurId(avisId, compteId)) {
            throw new AvisInvalideException("Vous avez déjà signalé cet avis.");
        }

        signalementRepo.save(AvisSignalementEntity.builder()
            .avisId(avisId)
            .auteurId(compteId)
            .motif(normaliser(request == null ? null : request.motif()))
            .build());

        if (StatutAvis.PUBLIE.name().equals(avis.getStatut())) {
            avis.setStatut(StatutAvis.SIGNALE.name());
            avisRepo.save(avis);
        }
    }

    // ── Modération ─────────────────────────────────────────────────────────

    @Transactional
    public AvisResponse modererAvis(UUID avisId, StatutAvis statut) {
        AvisEntity avis = avisRepo.findById(avisId)
            .orElseThrow(() -> new AvisNotFoundException(avisId));
        avis.setStatut(statut.name());
        AvisEntity saved = avisRepo.save(avis);

        PatientEntity patient = patientRepo.findById(saved.getPatientId()).orElse(null);
        return AvisResponse.from(
            saved,
            patient == null ? null : patient.getPrenom(),
            patient == null ? null : patient.getNom());
    }

    /** File de modération : signalés et masqués, les plus récemment touchés d'abord. */
    @Transactional(readOnly = true)
    public AvisPageResponse listerModeration(int page, int size) {
        Page<AvisProjection> resultats = avisRepo.findParStatuts(
            List.of(StatutAvis.SIGNALE.name(), StatutAvis.MASQUE.name()),
            PageRequest.of(Math.max(page - 1, 0), size));

        return new AvisPageResponse(
            resultats.getContent().stream().map(AvisResponse::from).toList(),
            resultats.getTotalElements(),
            resultats.getTotalPages(),
            page,
            size,
            null,
            resultats.getTotalElements(),
            List.of());
    }

    /** Compte local de l'appelant, à partir du sujet de son jeton Keycloak. */
    @Transactional(readOnly = true)
    public UUID compteIdDepuisKeycloak(String keycloakId) {
        return userRepo.findByKeycloakId(keycloakId)
            .map(u -> u.getId())
            .orElseThrow(() -> new AvisInvalideException(REFUS));
    }
}
