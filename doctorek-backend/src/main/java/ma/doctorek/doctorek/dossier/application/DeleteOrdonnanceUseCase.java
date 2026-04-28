package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class DeleteOrdonnanceUseCase {

    private final DossierRepository repository;

    public DeleteOrdonnanceUseCase(DossierRepository repository) {
        this.repository = repository;
    }

    public void execute(UUID id) {
        repository.deleteOrdonnance(id);
    }
}
