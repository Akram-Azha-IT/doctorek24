package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.application.dto.OrdonnanceResponse;
import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GetOrdonnancesUseCase {

    private final DossierRepository repository;

    public GetOrdonnancesUseCase(DossierRepository repository) {
        this.repository = repository;
    }

    public List<OrdonnanceResponse> execute(UUID patientId) {
        return repository.findOrdonnancesByPatientId(patientId)
            .stream().map(OrdonnanceResponse::from).toList();
    }
}
