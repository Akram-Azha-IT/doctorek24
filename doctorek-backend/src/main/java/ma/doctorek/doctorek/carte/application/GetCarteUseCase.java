package ma.doctorek.doctorek.carte.application;

import ma.doctorek.doctorek.auth.domain.UserRepository;
import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.carte.domain.CarteNotFoundException;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelle;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class GetCarteUseCase {

    private final CarteVirtuelleRepository repository;
    private final UserRepository userRepository;

    public GetCarteUseCase(CarteVirtuelleRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CarteVirtuelleResponse byPatientId(UUID patientId) {
        CarteVirtuelle carte = repository.findByPatientId(patientId)
                .orElseThrow(() -> new CarteNotFoundException("Carte non trouvée pour patient: " + patientId));
        String[] names = resolveNames(patientId);
        return CarteVirtuelleResponse.from(carte, names[0], names[1]);
    }

    @Transactional(readOnly = true)
    public CarteVirtuelleResponse byCardRef(String cardRef) {
        CarteVirtuelle carte = repository.findByCardRef(cardRef)
                .orElseThrow(() -> new CarteNotFoundException("Carte non trouvée: " + cardRef));
        String[] names = resolveNames(carte.patientId());
        return CarteVirtuelleResponse.from(carte, names[0], names[1]);
    }

    private String[] resolveNames(UUID patientId) {
        return userRepository.findById(patientId)
                .map(u -> new String[]{u.getFirstName(), u.getLastName()})
                .orElse(new String[]{null, null});
    }

    @Transactional(readOnly = true)
    public boolean existsByPatientId(UUID patientId) {
        return repository.existsByPatientId(patientId);
    }
}
