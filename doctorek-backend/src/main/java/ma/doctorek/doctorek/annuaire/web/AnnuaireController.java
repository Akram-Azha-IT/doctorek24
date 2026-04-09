package ma.doctorek.doctorek.annuaire.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.annuaire.application.GetMedecinProfileUseCase;
import ma.doctorek.doctorek.annuaire.application.SearchMedecinsUseCase;
import ma.doctorek.doctorek.annuaire.application.UpdateMedecinProfileUseCase;
import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;
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
    private final UpdateMedecinProfileUseCase updateMedecinProfileUseCase;

    public AnnuaireController(GetMedecinProfileUseCase getMedecinProfileUseCase,
                               SearchMedecinsUseCase searchMedecinsUseCase,
                               UpdateMedecinProfileUseCase updateMedecinProfileUseCase) {
        this.getMedecinProfileUseCase = getMedecinProfileUseCase;
        this.searchMedecinsUseCase = searchMedecinsUseCase;
        this.updateMedecinProfileUseCase = updateMedecinProfileUseCase;
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
}
