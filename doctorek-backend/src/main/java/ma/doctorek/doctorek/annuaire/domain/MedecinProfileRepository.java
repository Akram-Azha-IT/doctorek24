package ma.doctorek.doctorek.annuaire.domain;

import ma.doctorek.doctorek.annuaire.application.dto.PagedMedecinsResponse;
import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedecinProfileRepository {
    Optional<MedecinProfile> findMedecinById(UUID id);
    List<MedecinProfile> searchMedecins(String specialite, String ville);
    PagedMedecinsResponse searchMedecinsPaged(String specialite, String ville, String disponibilite, int page, int size);
    MedecinProfile updateProfile(UUID id, UpdateMedecinProfileRequest request);
    List<MedecinNearbyResult> findNearbyMedecins(double lat, double lng, double radiusKm, String specialite);
    MedecinProfile updatePhotoUrl(UUID id, String photoUrl);
}
