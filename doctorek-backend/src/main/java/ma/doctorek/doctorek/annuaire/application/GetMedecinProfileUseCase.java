package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class GetMedecinProfileUseCase {

    private final MedecinProfileRepository repo;

    public GetMedecinProfileUseCase(MedecinProfileRepository repo) {
        this.repo = repo;
    }

    @Cacheable(value = "medecins", key = "#id")
    public MedecinProfile execute(UUID id) {
        return repo.findMedecinById(id)
            .orElseThrow(() -> new MedecinNotFoundException(id));
    }
}
