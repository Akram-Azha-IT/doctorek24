package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.GestionEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.repository.GestionRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.Optional;
import java.util.UUID;

/**
 * Routage des notifications compte famille.
 * Règles (modèle Doctolib) :
 *  - patient majeur avec email propre → notifié directement ;
 *  - patient mineur ou sans email → le gestionnaire reçoit tout
 *    (préférence au représentant légal si plusieurs gestionnaires).
 */
@Service
public class NotificationRoutingService {

    private static final Logger log = LoggerFactory.getLogger(NotificationRoutingService.class);

    private final PatientRepository patientRepository;
    private final GestionRepository gestionRepository;
    private final UserRepository userRepository;

    public NotificationRoutingService(PatientRepository patientRepository,
                                      GestionRepository gestionRepository,
                                      UserRepository userRepository) {
        this.patientRepository = patientRepository;
        this.gestionRepository = gestionRepository;
        this.userRepository = userRepository;
    }

    /** Email destinataire pour un patient donné (vide si introuvable → logué). */
    @Transactional(readOnly = true)
    public Optional<String> resolveEmail(UUID patientId) {
        PatientEntity patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) {
            log.warn("Patient {} introuvable — notification email non routée", patientId);
            return Optional.empty();
        }

        if (!patient.isMineur() && patient.getEmail() != null && !patient.getEmail().isBlank()) {
            return Optional.of(patient.getEmail());
        }
        return resolveGestionnaireEmail(patientId);
    }

    /**
     * Compte utilisateur destinataire des notifications in-app :
     * le compte du patient lui-même s'il en a un, sinon son gestionnaire.
     */
    @Transactional(readOnly = true)
    public Optional<UUID> resolveCompteUserId(UUID patientId) {
        PatientEntity patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) {
            return Optional.empty();
        }
        if (patient.getCompteId() != null) {
            return Optional.of(patient.getCompteId());
        }
        return findGestionnairePrincipal(patientId).map(GestionEntity::getGestionnaireCompteId);
    }

    private Optional<String> resolveGestionnaireEmail(UUID patientId) {
        Optional<String> email = findGestionnairePrincipal(patientId)
            .flatMap(g -> userRepository.findById(g.getGestionnaireCompteId()))
            .map(u -> u.getEmail());
        if (email.isEmpty()) {
            log.warn("Aucun gestionnaire actif pour le patient {} — notification non routée", patientId);
        }
        return email;
    }

    /** Gestionnaire prioritaire : représentant légal déclaré d'abord, puis le plus ancien. */
    private Optional<GestionEntity> findGestionnairePrincipal(UUID patientId) {
        return gestionRepository.findByPatientIdAndActifTrue(patientId).stream()
            .min(Comparator
                .comparing((GestionEntity g) -> !g.isDeclarationRepresentantLegal())
                .thenComparing(GestionEntity::getCreatedAt));
    }
}
