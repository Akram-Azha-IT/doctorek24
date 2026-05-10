package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinPhotoRequest;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UpdateMedecinPhotoUseCase {

    private final MedecinProfileRepository repository;

    public UpdateMedecinPhotoUseCase(MedecinProfileRepository repository) {
        this.repository = repository;
    }

    public MedecinProfile execute(UUID id, UpdateMedecinPhotoRequest request) {
        return repository.updatePhotoUrl(id, request.photoUrl());
    }
}
