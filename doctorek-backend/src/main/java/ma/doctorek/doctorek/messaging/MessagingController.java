package ma.doctorek.doctorek.messaging;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.messaging.dto.ConversationResponse;
import ma.doctorek.doctorek.messaging.dto.MessageResponse;
import ma.doctorek.doctorek.messaging.dto.SendMessageRequest;
import ma.doctorek.doctorek.messaging.dto.StartConversationRequest;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.web.ApiResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messaging")
public class MessagingController {

    private final MessagingService messagingService;
    private final UserRepository   userRepository;

    public MessagingController(MessagingService messagingService, UserRepository userRepository) {
        this.messagingService = messagingService;
        this.userRepository   = userRepository;
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> startConversation(
            @Valid @RequestBody StartConversationRequest request,
            Principal principal) {
        User caller = resolveUser(principal.getName());
        ConversationResponse conv = messagingService.startOrGet(caller.getId(), request.otherUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(conv));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> listConversations(Principal principal) {
        User caller = resolveUser(principal.getName());
        return ResponseEntity.ok(ApiResponse.ok(messagingService.listConversations(caller.getId())));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @GetMapping("/conversations/{convId}/messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            @PathVariable UUID convId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Principal principal) {
        User caller = resolveUser(principal.getName());
        return ResponseEntity.ok(ApiResponse.ok(
                messagingService.getMessages(convId, caller.getId(), page, size)));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @PostMapping("/conversations/{convId}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable UUID convId,
            @Valid @RequestBody SendMessageRequest request,
            Principal principal) {
        if (!convId.equals(request.conversationId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("conversationId mismatch"));
        }
        User caller = resolveUser(principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(messagingService.sendMessage(caller.getId(), request)));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @PostMapping(value = "/conversations/{convId}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MessageResponse>> sendAudio(
            @PathVariable UUID convId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("durationSec") int durationSec,
            @RequestParam(value = "clientMsgId", required = false) String clientMsgId,
            Principal principal) {
        User caller = resolveUser(principal.getName());
        MessageResponse msg = messagingService.sendAudioMessage(
                caller.getId(), convId, file, durationSec, clientMsgId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(msg));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @GetMapping("/messages/{messageId}/audio")
    public ResponseEntity<Resource> getAudio(
            @PathVariable UUID messageId,
            Principal principal) throws java.io.IOException {
        User caller = resolveUser(principal.getName());
        MessagingService.AudioStream audio = messagingService.getAudio(messageId, caller.getId());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(audio.mime()))
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Disposition", "inline")
                .body(audio.resource());
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @PutMapping("/conversations/{convId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID convId,
            Principal principal) {
        User caller = resolveUser(principal.getName());
        messagingService.markRead(convId, caller.getId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + email));
    }
}
