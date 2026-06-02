package ma.doctorek.doctorek.messaging;

import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.messaging.dto.MessageResponse;
import ma.doctorek.doctorek.messaging.dto.SendMessageRequest;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.NoSuchElementException;

@Controller
public class ChatController {

    private final MessagingService messagingService;
    private final UserRepository   userRepository;

    public ChatController(MessagingService messagingService, UserRepository userRepository) {
        this.messagingService = messagingService;
        this.userRepository   = userRepository;
    }

    @MessageMapping("/chat.send")
    public MessageResponse send(@Payload SendMessageRequest request, Principal principal) {
        User sender = resolveUser(principal.getName());
        return messagingService.sendMessage(sender.getId(), request);
    }

    @MessageMapping("/chat.read")
    public void markRead(@Payload java.util.UUID conversationId, Principal principal) {
        User caller = resolveUser(principal.getName());
        messagingService.markRead(conversationId, caller.getId());
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + email));
    }
}
