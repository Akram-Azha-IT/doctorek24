package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class GetMedecinProfileUseCase {

    private final MedecinProfileRepository repo;

    public GetMedecinProfileUseCase(MedecinProfileRepository repo) {
        this.repo = repo;
    }

    public MedecinProfile execute(UUID id) {
        return repo.findMedecinById(id)
            .orElseThrow(() -> new MedecinNotFoundException(id));
    }
}
