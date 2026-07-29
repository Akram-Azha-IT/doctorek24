package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.entity.User;
import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.AddProcheRequest;
import ma.doctorek.doctorek.dto.ProcheResponse;
import ma.doctorek.doctorek.dto.UpdateProcheRequest;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.ProcheService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

/** Compte famille : gestion des proches du compte connecté. */
@RestController
@RequestMapping("/api/v1/patients/me/proches")
public class ProcheController {

    private final ProcheService procheService;
    private final UserRepository userRepo;

    public ProcheController(ProcheService procheService, UserRepository userRepo) {
        this.procheService = procheService;
        this.userRepo = userRepo;
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProcheResponse>>> listProfils(Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(procheService.listProfils(resolveUserId(principal))));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping
    public ResponseEntity<ApiResponse<ProcheResponse>> addProche(
            Principal principal,
            @Valid @RequestBody AddProcheRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(procheService.addProche(resolveUserId(principal), request)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{procheId}")
    public ResponseEntity<ApiResponse<ProcheResponse>> updateProche(
            Principal principal,
            @PathVariable UUID procheId,
            @Valid @RequestBody UpdateProcheRequest request) {
        return ResponseEntity.ok(
            ApiResponse.ok(procheService.updateProche(resolveUserId(principal), procheId, request)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @DeleteMapping("/{procheId}")
    public ResponseEntity<ApiResponse<Void>> removeProche(
            Principal principal,
            @PathVariable UUID procheId) {
        procheService.removeProche(resolveUserId(principal), procheId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private UUID resolveUserId(Principal principal) {
        return userRepo.findByEmail(principal.getName())
            .map(User::getId)
            .orElseThrow();
    }
}
