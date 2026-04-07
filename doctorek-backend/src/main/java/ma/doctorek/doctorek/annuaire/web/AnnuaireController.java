package ma.doctorek.doctorek.annuaire.web;

import ma.doctorek.doctorek.annuaire.application.GetMedecinProfileUseCase;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.shared.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/annuaire")
public class AnnuaireController {

    private final GetMedecinProfileUseCase getMedecinProfileUseCase;

    public AnnuaireController(GetMedecinProfileUseCase getMedecinProfileUseCase) {
        this.getMedecinProfileUseCase = getMedecinProfileUseCase;
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
}
