package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class DeleteDocumentUseCase {

    private final DossierRepository repository;

    public DeleteDocumentUseCase(DossierRepository repository) {
        this.repository = repository;
    }

    public void execute(UUID id) {
        repository.findDocumentById(id).ifPresent(doc -> {
            try {
                Files.deleteIfExists(Paths.get(doc.chemin()));
            } catch (IOException ignored) {}
        });
        repository.deleteDocument(id);
    }
}
