package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.dto.AdminStatsResponse;
import ma.doctorek.doctorek.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.dto.CartesPageResponse;
import ma.doctorek.doctorek.dto.UsersPageResponse;
import ma.doctorek.doctorek.service.AdminService;
import ma.doctorek.doctorek.service.CarteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final CarteService carteService;

    public AdminController(AdminService adminService, CarteService carteService) {
        this.adminService = adminService;
        this.carteService = carteService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getStats()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<UsersPageResponse>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listUsers(role, search, page, size)));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable UUID id) {
        adminService.toggleUserActive(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id, Principal principal) {
        adminService.deleteUser(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/cartes")
    public ResponseEntity<ApiResponse<CartesPageResponse>> getCartes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listCartes(page, size)));
    }

    @GetMapping("/patients/{patientId}/carte")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> getPatientCarte(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(carteService.getByPatientId(patientId)));
    }
}
