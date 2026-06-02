package ma.doctorek.doctorek.notification;

import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService service;
    private final UserRepository userRepo;

    public NotificationController(NotificationService service, UserRepository userRepo) {
        this.service  = service;
        this.userRepo = userRepo;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> list(Principal principal) {
        UUID userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.ok(service.list(userId)));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount(Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(service.countUnread(resolveUserId(principal))));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable UUID id, Principal principal) {
        service.markRead(id, resolveUserId(principal));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(Principal principal) {
        service.markAllRead(resolveUserId(principal));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private UUID resolveUserId(Principal principal) {
        return userRepo.findByEmail(principal.getName())
                .map(u -> u.getId())
                .orElseThrow();
    }
}
