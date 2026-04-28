package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.domain.DocumentMedical;
import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.nio.file.Paths;
import java.util.UUID;

@Service
public class DownloadDocumentUseCase {

    private final DossierRepository repository;

    public DownloadDocumentUseCase(DossierRepository repository) {
        this.repository = repository;
    }

    public record DownloadResult(Resource resource, String nom) {}

    public DownloadResult execute(UUID id) {
        DocumentMedical doc = repository.findDocumentById(id)
            .orElseThrow(() -> new RuntimeException("Document not found: " + id));
        Resource resource = new PathResource(Paths.get(doc.chemin()));
        return new DownloadResult(resource, doc.nom());
    }
}
