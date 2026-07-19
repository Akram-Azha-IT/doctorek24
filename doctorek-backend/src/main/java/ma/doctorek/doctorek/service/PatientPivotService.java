package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.repository.PatientDetailRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Accès à l'entité pivot patient.patient.
 * Les users créés après la migration V30 n'ont pas encore de ligne pivot :
 * getOrCreateSelf la crée paresseusement (id = users.id, même convention que le backfill).
 */
@Service
public class PatientPivotService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PatientDetailRepository patientDetailRepository;

    public PatientPivotService(PatientRepository patientRepository,
                               UserRepository userRepository,
                               PatientDetailRepository patientDetailRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.patientDetailRepository = patientDetailRepository;
    }

    @Transactional
    public PatientEntity getOrCreateSelf(UUID userId) {
        return patientRepository.findByCompteId(userId)
            .orElseGet(() -> createFromUser(userId));
    }

    private PatientEntity createFromUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("utilisateur " + userId));

        var details = patientDetailRepository.findById(userId).orElse(null);
        var dateNaissance = details != null ? details.getDateNaissance() : null;
        String telephone = details != null && details.getTelephone() != null
            ? details.getTelephone() : user.getPhone();

        patientRepository.insertSelfPivot(userId, user.getLastName(), user.getFirstName(),
            dateNaissance, user.getEmail(), telephone);
        return patientRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("pivot patient " + userId));
    }
}
