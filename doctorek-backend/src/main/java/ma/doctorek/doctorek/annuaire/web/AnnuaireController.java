package ma.doctorek.doctorek.annuaire.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.annuaire.application.GetMedecinProfileUseCase;
import ma.doctorek.doctorek.annuaire.application.SearchMedecinsUseCase;
import ma.doctorek.doctorek.annuaire.application.SearchNearbyMedecinsUseCase;
import ma.doctorek.doctorek.annuaire.application.UpdateMedecinPhotoUseCase;
import ma.doctorek.doctorek.annuaire.application.UpdateMedecinProfileUseCase;
import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinPhotoRequest;
import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;
import ma.doctorek.doctorek.annuaire.domain.MedecinNearbyResult;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.shared.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/annuaire")
public class AnnuaireController {

    private final GetMedecinProfileUseCase getMedecinProfileUseCase;
    private final SearchMedecinsUseCase searchMedecinsUseCase;
    private final SearchNearbyMedecinsUseCase searchNearbyMedecinsUseCase;
    private final UpdateMedecinProfileUseCase updateMedecinProfileUseCase;
    private final UpdateMedecinPhotoUseCase updateMedecinPhotoUseCase;

    public AnnuaireController(GetMedecinProfileUseCase getMedecinProfileUseCase,
                               SearchMedecinsUseCase searchMedecinsUseCase,
                               SearchNearbyMedecinsUseCase searchNearbyMedecinsUseCase,
                               UpdateMedecinProfileUseCase updateMedecinProfileUseCase,
                               UpdateMedecinPhotoUseCase updateMedecinPhotoUseCase) {
        this.getMedecinProfileUseCase = getMedecinProfileUseCase;
        this.searchMedecinsUseCase = searchMedecinsUseCase;
        this.searchNearbyMedecinsUseCase = searchNearbyMedecinsUseCase;
        this.updateMedecinProfileUseCase = updateMedecinProfileUseCase;
        this.updateMedecinPhotoUseCase = updateMedecinPhotoUseCase;
    }

    /**
     * GET /api/v1/annuaire/medecins/nearby?lat=&lng=&radius=&specialite=
     * Médecins à proximité, triés par distance croissante.
     * Must be declared before /{id} to avoid Spring matching "nearby" as a UUID.
     */
    @GetMapping("/medecins/nearby")
    public ResponseEntity<ApiResponse<List<MedecinNearbyResult>>> searchNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "20") double radius,
            @RequestParam(required = false) String specialite) {
        List<MedecinNearbyResult> results = searchNearbyMedecinsUseCase.execute(lat, lng, radius, specialite);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    /**
     * GET /api/v1/annuaire/medecins/{id}
     * Profil public d'un médecin.
     */
    @GetMapping("/medecins/{id}")
    public ResponseEntity<ApiResponse<MedecinProfile>> getMedecin(@PathVariable UUID id) {
        MedecinProfile profile = getMedecinProfileUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    /**
     * GET /api/v1/annuaire/medecins?specialite=X&ville=Y
     * Recherche de médecins par spécialité et/ou ville (params optionnels).
     */
    @GetMapping("/medecins")
    public ResponseEntity<ApiResponse<List<MedecinProfile>>> searchMedecins(
            @RequestParam(required = false) String specialite,
            @RequestParam(required = false) String ville) {
        List<MedecinProfile> results = searchMedecinsUseCase.execute(specialite, ville);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    /**
     * PUT /api/v1/annuaire/medecins/{id}
     * Mise à jour du profil d'un médecin.
     */
    @PutMapping("/medecins/{id}")
    public ResponseEntity<ApiResponse<MedecinProfile>> updateMedecinProfile(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMedecinProfileRequest request) {
        MedecinProfile updated = updateMedecinProfileUseCase.execute(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * PUT /api/v1/annuaire/medecins/{id}/photo
     * Met à jour la photo de profil d'un médecin.
     */
    @PutMapping("/medecins/{id}/photo")
    public ResponseEntity<ApiResponse<MedecinProfile>> updateMedecinPhoto(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMedecinPhotoRequest request) {
        MedecinProfile updated = updateMedecinPhotoUseCase.execute(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
