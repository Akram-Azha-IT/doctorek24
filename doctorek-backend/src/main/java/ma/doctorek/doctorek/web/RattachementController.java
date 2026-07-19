package ma.doctorek.doctorek.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.ProcheResponse;
import ma.doctorek.doctorek.dto.RattachementInfoResponse;
import ma.doctorek.doctorek.dto.ReclamerRattachementRequest;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.RattachementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

/** Rattachement d'un RDV créé par le praticien au compte famille du titulaire. */
@RestController
@RequestMapping("/api/v1/patients/rattachement")
public class RattachementController {

    private final RattachementService rattachementService;
    private final UserRepository userRepo;

    public RattachementController(RattachementService rattachementService, UserRepository userRepo) {
        this.rattachementService = rattachementService;
        this.userRepo = userRepo;
    }

    /** Public : infos masquées affichées sur la page /rattacher/{token}. */
    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<RattachementInfoResponse>> getInfo(@PathVariable UUID token) {
        return ResponseEntity.ok(ApiResponse.ok(rattachementService.getInfo(token)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping("/{token}/reclamer")
    public ResponseEntity<ApiResponse<ProcheResponse>> reclamer(
            Principal principal,
            @PathVariable UUID token,
            @Valid @RequestBody ReclamerRattachementRequest request) {
        UUID requesterId = userRepo.findByEmail(principal.getName())
            .map(u -> u.getId())
            .orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(
            rattachementService.reclamer(token, requesterId, request)));
    }
}
