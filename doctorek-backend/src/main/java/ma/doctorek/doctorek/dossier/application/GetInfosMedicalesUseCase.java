package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.application.dto.InfosMedicalesResponse;
import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class GetInfosMedicalesUseCase {

    private final DossierRepository repository;

    public GetInfosMedicalesUseCase(DossierRepository repository) {
        this.repository = repository;
    }

    public InfosMedicalesResponse execute(UUID patientId) {
        return repository.findInfosByPatientId(patientId)
            .map(InfosMedicalesResponse::from)
            .orElseGet(() -> InfosMedicalesResponse.empty(patientId));
    }
}
