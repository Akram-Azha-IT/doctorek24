package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.exception.AccesPatientRefuseException;
import ma.doctorek.doctorek.exception.PatientNotFoundException;
import ma.doctorek.doctorek.repository.GestionRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Contrôle d'accès compte famille : un compte ne peut agir (réserver,
 * consulter les RDV) que pour lui-même ou pour un patient qu'il gère
 * via une relation patient.gestion active.
 */
@Service
public class AccesPatientService {

    private final PatientRepository patientRepository;
    private final GestionRepository gestionRepository;
    private final PatientPivotService patientPivotService;

    public AccesPatientService(PatientRepository patientRepository,
                               GestionRepository gestionRepository,
                               PatientPivotService patientPivotService) {
        this.patientRepository = patientRepository;
        this.gestionRepository = gestionRepository;
        this.patientPivotService = patientPivotService;
    }

    @Transactional
    public boolean peutGererPatient(UUID requesterUserId, UUID patientId) {
        // Cas fréquent : le patient est le requester lui-même (id pivot = id user
        // pour les titulaires). Crée la ligne pivot au besoin (users post-migration).
        if (requesterUserId.equals(patientId)) {
            patientPivotService.getOrCreateSelf(requesterUserId);
            return true;
        }

        PatientEntity patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new PatientNotFoundException(patientId));

        if (requesterUserId.equals(patient.getCompteId())) {
            return true;
        }
        return gestionRepository.existsByGestionnaireCompteIdAndPatientIdAndActifTrue(
            requesterUserId, patientId);
    }

    @Transactional
    public void verifierAcces(UUID requesterUserId, UUID patientId) {
        if (!peutGererPatient(requesterUserId, patientId)) {
            throw new AccesPatientRefuseException(patientId);
        }
    }
}
