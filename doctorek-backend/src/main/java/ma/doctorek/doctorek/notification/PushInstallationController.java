package ma.doctorek.doctorek.notification;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/push/installations")
public class PushInstallationController {
    private final PushInstallationService service;
    private final UserRepository users;

    public PushInstallationController(PushInstallationService service, UserRepository users) {
        this.service = service; this.users = users;
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody PushRegistrationRequest request, Principal principal) {
        service.register(resolveUserId(principal), request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{installationId}")
    public ResponseEntity<ApiResponse<Void>> unregister(@PathVariable UUID installationId, Principal principal) {
        service.unregister(resolveUserId(principal), installationId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private UUID resolveUserId(Principal principal) {
        return users.findByEmail(principal.getName()).orElseThrow().getId();
    }
}
