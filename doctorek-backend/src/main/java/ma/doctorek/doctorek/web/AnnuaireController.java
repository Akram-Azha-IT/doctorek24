package ma.doctorek.doctorek.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.MedecinProfile;
import ma.doctorek.doctorek.dto.PagedMedecinsResponse;
import ma.doctorek.doctorek.dto.UpdateMedecinPhotoRequest;
import ma.doctorek.doctorek.dto.UpdateMedecinProfileRequest;
import ma.doctorek.doctorek.service.AnnuaireService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/annuaire")
public class AnnuaireController {

    private final AnnuaireService annuaireService;

    public AnnuaireController(AnnuaireService annuaireService) {
        this.annuaireService = annuaireService;
    }

    @GetMapping("/medecins/nearby")
    public ResponseEntity<ApiResponse<List<AnnuaireService.MedecinNearbyResult>>> searchNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "20") double radius,
            @RequestParam(required = false) String specialite) {
        return ResponseEntity.ok(ApiResponse.ok(annuaireService.searchNearby(lat, lng, radius, specialite)));
    }

    @GetMapping("/medecins/{id}")
    public ResponseEntity<ApiResponse<MedecinProfile>> getMedecin(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(annuaireService.getMedecinProfile(id)));
    }

    @GetMapping("/medecins")
    public ResponseEntity<ApiResponse<PagedMedecinsResponse>> searchMedecins(
            @RequestParam(required = false) String specialite,
            @RequestParam(required = false) String ville,
            @RequestParam(defaultValue = "all") String disponibilite,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
            annuaireService.searchMedecins(specialite, ville, disponibilite, page, size)));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @PutMapping("/medecins/{id}")
    public ResponseEntity<ApiResponse<MedecinProfile>> updateMedecinProfile(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMedecinProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(annuaireService.updateMedecinProfile(id, request)));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @PutMapping("/medecins/{id}/photo")
    public ResponseEntity<ApiResponse<MedecinProfile>> updateMedecinPhoto(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMedecinPhotoRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(annuaireService.updateMedecinPhoto(id, request)));
    }
}
