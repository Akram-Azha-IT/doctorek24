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
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
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
     * Tous les destinataires d'un rappel : le patient et ceux qui le gèrent.
     *
     * <p>Le routage nominal est exclusif — le proche <em>ou</em> son gestionnaire. Pour
     * un rappel, c'est insuffisant : le titulaire qui a pris le rendez-vous doit être
     * prévenu même quand le proche a sa propre adresse, puisque c'est souvent lui qui
     * accompagne. À l'inverse, un proche qui a donné son adresse veut être prévenu
     * directement.
     *
     * <p>Les adresses sont normalisées avant dédoublonnage : titulaire et proche
     * partagent parfois la même boîte, qui ne doit pas recevoir deux fois le rappel.
     */
    @Transactional(readOnly = true)
    public Set<String> resolveTousEmails(UUID patientId) {
        PatientEntity patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) {
            log.warn("Patient {} introuvable — rappel non routé", patientId);
            return Set.of();
        }

        Set<String> emails = new LinkedHashSet<>();
        ajouterEmail(emails, patient.getEmail());
        gestionRepository.findByPatientIdAndActifTrue(patientId).stream()
            .map(GestionEntity::getGestionnaireCompteId)
            .map(userRepository::findById)
            .flatMap(Optional::stream)
            .forEach(u -> ajouterEmail(emails, u.getEmail()));

        if (emails.isEmpty()) {
            log.warn("Aucun destinataire pour le patient {} — rappel non routé", patientId);
        }
        return emails;
    }

    private void ajouterEmail(Set<String> cible, String email) {
        if (email != null && !email.isBlank()) {
            cible.add(email.trim().toLowerCase(Locale.ROOT));
        }
    }

    /** Comptes destinataires des notifications in-app : le patient et ses gestionnaires. */
    @Transactional(readOnly = true)
    public Set<UUID> resolveTousComptes(UUID patientId) {
        PatientEntity patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) return Set.of();

        Set<UUID> comptes = new LinkedHashSet<>();
        if (patient.getCompteId() != null) comptes.add(patient.getCompteId());
        gestionRepository.findByPatientIdAndActifTrue(patientId).stream()
            .map(GestionEntity::getGestionnaireCompteId)
            .forEach(comptes::add);
        return comptes;
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
