package ma.doctorek.doctorek.annuaire.domain;

import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedecinProfileRepository {
    Optional<MedecinProfile> findMedecinById(UUID id);
    List<MedecinProfile> searchMedecins(String specialite, String ville);
    MedecinProfile updateProfile(UUID id, UpdateMedecinProfileRequest request);
}
