package ma.doctorek.doctorek.admin.web;

import ma.doctorek.doctorek.admin.application.GetAdminStatsUseCase;
import ma.doctorek.doctorek.admin.application.ListCartesUseCase;
import ma.doctorek.doctorek.admin.application.ListUsersUseCase;
import ma.doctorek.doctorek.admin.application.ToggleUserActiveUseCase;
import ma.doctorek.doctorek.admin.application.dto.AdminStatsResponse;
import ma.doctorek.doctorek.admin.application.dto.CartesPageResponse;
import ma.doctorek.doctorek.admin.application.dto.UsersPageResponse;
import ma.doctorek.doctorek.carte.application.GetCarteUseCase;
import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.carte.domain.CarteNotFoundException;
import ma.doctorek.doctorek.shared.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final GetAdminStatsUseCase getStats;
    private final ListUsersUseCase listUsers;
    private final ToggleUserActiveUseCase toggleActive;
    private final ListCartesUseCase listCartes;
    private final GetCarteUseCase getCarte;

    public AdminController(GetAdminStatsUseCase getStats,
                           ListUsersUseCase listUsers,
                           ToggleUserActiveUseCase toggleActive,
                           ListCartesUseCase listCartes,
                           GetCarteUseCase getCarte) {
        this.getStats     = getStats;
        this.listUsers    = listUsers;
        this.toggleActive = toggleActive;
        this.listCartes   = listCartes;
        this.getCarte     = getCarte;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(getStats.execute()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<UsersPageResponse>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(listUsers.execute(role, search, page, size)));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable UUID id) {
        toggleActive.execute(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/cartes")
    public ResponseEntity<ApiResponse<CartesPageResponse>> getCartes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(listCartes.execute(page, size)));
    }

    @GetMapping("/patients/{patientId}/carte")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> getPatientCarte(@PathVariable UUID patientId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(getCarte.byPatientId(patientId)));
        } catch (CarteNotFoundException ex) {
            return ResponseEntity.status(404).body(ApiResponse.error(ex.getMessage()));
        }
    }
}
