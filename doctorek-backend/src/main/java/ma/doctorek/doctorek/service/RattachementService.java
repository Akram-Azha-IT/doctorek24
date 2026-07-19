package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.ProcheResponse;
import ma.doctorek.doctorek.dto.RattachementInfoResponse;
import ma.doctorek.doctorek.dto.ReclamerRattachementRequest;
import ma.doctorek.doctorek.entity.GestionEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.RattachementTokenEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.exception.PatientNotFoundException;
import ma.doctorek.doctorek.exception.RattachementInvalideException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.DocumentMedicalRepository;
import ma.doctorek.doctorek.repository.GestionRepository;
import ma.doctorek.doctorek.repository.OrdonnanceRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.RattachementTokenRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.util.Noms;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Rattachement d'un patient créé par le praticien au compte famille d'un titulaire.
 * Sécurité : token UUID non devinable, usage unique, expiration 30 jours,
 * 5 tentatives max sur la vérification des 3 premières lettres du nom.
 */
@Service
public class RattachementService {

    private static final Logger log = LoggerFactory.getLogger(RattachementService.class);
    private static final Duration VALIDITE = Duration.ofDays(30);
    private static final int MAX_TENTATIVES = 5;

    private final RattachementTokenRepository tokenRepo;
    private final PatientRepository patientRepo;
    private final GestionRepository gestionRepo;
    private final RendezVousRepository rdvRepo;
    private final UserRepository userRepo;
    private final PatientPivotService patientPivotService;
    private final OrdonnanceRepository ordonnanceRepo;
    private final DocumentMedicalRepository documentRepo;
    private final NotificationService notificationService;

    public RattachementService(RattachementTokenRepository tokenRepo,
                               PatientRepository patientRepo,
                               GestionRepository gestionRepo,
                               RendezVousRepository rdvRepo,
                               UserRepository userRepo,
                               PatientPivotService patientPivotService,
                               OrdonnanceRepository ordonnanceRepo,
                               DocumentMedicalRepository documentRepo,
                               NotificationService notificationService) {
        this.tokenRepo = tokenRepo;
        this.patientRepo = patientRepo;
        this.gestionRepo = gestionRepo;
        this.rdvRepo = rdvRepo;
        this.userRepo = userRepo;
        this.patientPivotService = patientPivotService;
        this.ordonnanceRepo = ordonnanceRepo;
        this.documentRepo = documentRepo;
        this.notificationService = notificationService;
    }

    /**
     * Crée un token si le patient est rattachable : sans compte propre,
     * sans gestionnaire actif, et avec un email où envoyer le lien.
     */
    @Transactional
    public Optional<RattachementTokenEntity> creerTokenSiEligible(PatientEntity patient, UUID rdvId) {
        boolean eligible = patient.getCompteId() == null
            && gestionRepo.findByPatientIdAndActifTrue(patient.getId()).isEmpty()
            && patient.getEmail() != null && !patient.getEmail().isBlank();
        if (!eligible) {
            return Optional.empty();
        }
        RattachementTokenEntity token = new RattachementTokenEntity(
            patient.getId(), rdvId, Instant.now().plus(VALIDITE));
        return Optional.of(tokenRepo.save(token));
    }

    /** Infos publiques masquées — jamais le nom complet (c'est le secret vérifié). */
    @Transactional(readOnly = true)
    public RattachementInfoResponse getInfo(UUID token) {
        RattachementTokenEntity entity = tokenRepo.findById(token)
            .orElseThrow(RattachementInvalideException::introuvable);

        PatientEntity patient = patientRepo.findById(entity.getPatientId())
            .orElseThrow(RattachementInvalideException::introuvable);

        LocalDate dateRdv = null;
        LocalTime heureRdv = null;
        String medecinNom = null;
        if (entity.getRdvId() != null) {
            RendezVousEntity rdv = rdvRepo.findById(entity.getRdvId()).orElse(null);
            if (rdv != null) {
                dateRdv = rdv.getDateRdv();
                heureRdv = rdv.getHeureRdv();
                medecinNom = userRepo.findById(rdv.getMedecinId())
                    .map(m -> "Dr. " + m.getFirstName() + " " + m.getLastName())
                    .orElse(null);
            }
        }

        String prenomInitiale = patient.getPrenom().isEmpty()
            ? "?" : patient.getPrenom().substring(0, 1).toUpperCase();

        return new RattachementInfoResponse(medecinNom, dateRdv, heureRdv,
            prenomInitiale, entity.estExpire(), entity.estUtilise());
    }

    /** Vérifie les 3 lettres puis rattache le patient au compte du requester. */
    @Transactional
    public ProcheResponse reclamer(UUID token, UUID requesterUserId, ReclamerRattachementRequest request) {
        RattachementTokenEntity entity = tokenRepo.findById(token)
            .orElseThrow(RattachementInvalideException::introuvable);

        if (entity.estUtilise()) throw RattachementInvalideException.dejaUtilise();
        if (entity.estExpire()) throw RattachementInvalideException.expire();
        if (entity.getTentatives() >= MAX_TENTATIVES) throw RattachementInvalideException.bloque();

        PatientEntity patient = patientRepo.findById(entity.getPatientId())
            .orElseThrow(() -> new PatientNotFoundException(entity.getPatientId()));

        if (!lettresCorrespondent(patient.getNom(), request.troisLettres())) {
            entity.setTentatives(entity.getTentatives() + 1);
            tokenRepo.save(entity);
            int restantes = MAX_TENTATIVES - entity.getTentatives();
            if (restantes <= 0) throw RattachementInvalideException.bloque();
            throw RattachementInvalideException.lettresIncorrectes(restantes);
        }

        // Le patient a pu obtenir son propre compte entre-temps
        if (patient.getCompteId() != null) {
            throw new RattachementInvalideException(
                "Ce patient dispose déjà de son propre compte",
                org.springframework.http.HttpStatus.CONFLICT);
        }

        return request.pourMoi()
            ? fusionnerAvecMonProfil(entity, patient, requesterUserId)
            : rattacherCommeProche(entity, patient, requesterUserId, request);
    }

    /**
     * « Ce rendez-vous est pour moi » : la fiche patient créée par le cabinet est
     * fusionnée avec le profil pivot du titulaire — RDV, ordonnances et documents
     * réaffectés, fiche orpheline supprimée (le token part avec elle en cascade).
     */
    private ProcheResponse fusionnerAvecMonProfil(RattachementTokenEntity entity,
                                                  PatientEntity orphelin,
                                                  UUID requesterUserId) {
        PatientEntity self = patientPivotService.getOrCreateSelf(requesterUserId);

        rdvRepo.reassignPatient(orphelin.getId(), self.getId());
        ordonnanceRepo.reassignPatient(orphelin.getId(), self.getId());
        documentRepo.reassignPatient(orphelin.getId(), self.getId());
        patientRepo.delete(orphelin);

        log.info("Fiche patient {} fusionnée avec le profil {} (compte {})",
            orphelin.getId(), self.getId(), requesterUserId);
        notifierRattachement(entity, requesterUserId,
            "Le rendez-vous créé par votre médecin a été ajouté à votre espace.");

        return ProcheResponse.self(self);
    }

    private ProcheResponse rattacherCommeProche(RattachementTokenEntity entity,
                                                PatientEntity patient,
                                                UUID requesterUserId,
                                                ReclamerRattachementRequest request) {
        if (request.role() == null || !Boolean.TRUE.equals(request.declarationRepresentantLegal())) {
            throw new IllegalArgumentException(
                "Le lien avec le proche et la déclaration de représentant légal sont obligatoires");
        }

        GestionEntity gestion = gestionRepo
            .findByGestionnaireCompteIdAndPatientIdAndActifTrue(requesterUserId, patient.getId())
            .orElseGet(() -> gestionRepo.save(new GestionEntity(
                requesterUserId, patient.getId(), request.role(), request.declarationRepresentantLegal())));

        entity.setUsedAt(Instant.now());
        tokenRepo.save(entity);
        log.info("Patient {} rattaché au compte {} via token {}", patient.getId(), requesterUserId, entity.getToken());
        notifierRattachement(entity, requesterUserId,
            "Le rendez-vous de " + patient.getPrenom() + " a été rattaché à votre compte famille.");

        return ProcheResponse.from(patient, gestion);
    }

    private void notifierRattachement(RattachementTokenEntity entity, UUID userId, String body) {
        String dateInfo = entity.getRdvId() == null ? "" :
            rdvRepo.findById(entity.getRdvId())
                .map(r -> " (" + r.getDateRdv() + " à " + r.getHeureRdv() + ")")
                .orElse("");
        notificationService.push(userId, "RDV_RATTACHE",
            "Rendez-vous rattaché à votre compte", body + dateInfo);
    }

    private boolean lettresCorrespondent(String nom, String saisie) {
        String nomNorm = Noms.normaliser(nom);
        String saisieNorm = Noms.normaliser(saisie);
        if (nomNorm.isEmpty() || saisieNorm.length() != 3) return false;
        // Noms de moins de 3 lettres (ex. « Ba ») : le nom entier doit ouvrir la saisie
        if (nomNorm.length() < 3) return saisieNorm.startsWith(nomNorm);
        return nomNorm.startsWith(saisieNorm);
    }
}
