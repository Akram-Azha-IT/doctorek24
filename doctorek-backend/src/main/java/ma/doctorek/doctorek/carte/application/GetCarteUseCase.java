package ma.doctorek.doctorek.carte.application;

import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.carte.domain.CarteNotFoundException;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class GetCarteUseCase {

    private final CarteVirtuelleRepository repository;

    public GetCarteUseCase(CarteVirtuelleRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public CarteVirtuelleResponse byPatientId(UUID patientId) {
        return repository.findByPatientId(patientId)
                .map(CarteVirtuelleResponse::from)
                .orElseThrow(() -> new CarteNotFoundException("Carte non trouvée pour patient: " + patientId));
    }

    @Transactional(readOnly = true)
    public CarteVirtuelleResponse byCardRef(String cardRef) {
        return repository.findByCardRef(cardRef)
                .map(CarteVirtuelleResponse::from)
                .orElseThrow(() -> new CarteNotFoundException("Carte non trouvée: " + cardRef));
    }

    @Transactional(readOnly = true)
    public boolean existsByPatientId(UUID patientId) {
        return repository.existsByPatientId(patientId);
    }
}
