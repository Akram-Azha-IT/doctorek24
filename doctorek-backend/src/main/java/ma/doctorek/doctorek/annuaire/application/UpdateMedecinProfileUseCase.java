package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UpdateMedecinProfileUseCase {

    private final MedecinProfileRepository repo;

    public UpdateMedecinProfileUseCase(MedecinProfileRepository repo) {
        this.repo = repo;
    }

    public MedecinProfile execute(UUID id, UpdateMedecinProfileRequest request) {
        return repo.updateProfile(id, request);
    }
}
