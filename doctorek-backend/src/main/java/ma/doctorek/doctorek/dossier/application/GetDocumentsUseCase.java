package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.application.dto.DocumentMedicalResponse;
import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GetDocumentsUseCase {

    private final DossierRepository repository;

    public GetDocumentsUseCase(DossierRepository repository) {
        this.repository = repository;
    }

    public List<DocumentMedicalResponse> execute(UUID patientId) {
        return repository.findDocumentsByPatientId(patientId)
            .stream().map(DocumentMedicalResponse::from).toList();
    }
}
