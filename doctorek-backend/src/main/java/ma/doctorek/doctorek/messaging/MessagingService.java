package ma.doctorek.doctorek.messaging;

import ma.doctorek.doctorek.entity.ConversationEntity;
import ma.doctorek.doctorek.entity.MessageEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.messaging.dto.ConversationResponse;
import ma.doctorek.doctorek.messaging.dto.MessageResponse;
import ma.doctorek.doctorek.messaging.dto.SendMessageRequest;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.ConversationRepository;
import ma.doctorek.doctorek.repository.MessageRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class MessagingService {

    private final ConversationRepository conversationRepo;
    private final MessageRepository      messageRepo;
    private final UserRepository         userRepo;
    private final SimpMessagingTemplate  stompTemplate;
    private final NotificationService    notifService;

    public MessagingService(ConversationRepository conversationRepo,
                             MessageRepository messageRepo,
                             UserRepository userRepo,
                             SimpMessagingTemplate stompTemplate,
                             NotificationService notifService) {
        this.conversationRepo = conversationRepo;
        this.messageRepo      = messageRepo;
        this.userRepo         = userRepo;
        this.stompTemplate    = stompTemplate;
        this.notifService     = notifService;
    }

    /** Find or create a conversation between caller and otherUser. */
    @Transactional
    public ConversationResponse startOrGet(UUID callerId, UUID otherUserId) {
        User caller = resolveById(callerId);
        User other  = resolveById(otherUserId);

        UUID medecinId = caller.getRole() == Role.MEDECIN ? caller.getId() : other.getId();
        UUID patientId = caller.getRole() == Role.PATIENT ? caller.getId() : other.getId();

        ConversationEntity conv = conversationRepo.findByMedecinIdAndPatientId(medecinId, patientId)
                .orElseGet(() -> conversationRepo.save(new ConversationEntity(medecinId, patientId)));

        return toResponse(conv, callerId);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(UUID userId) {
        return conversationRepo.findByParticipant(userId)
                .stream()
                .map(c -> toResponse(c, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(UUID convId, UUID callerId, int page, int size) {
        assertParticipant(convId, callerId);
        Page<MessageEntity> msgs = messageRepo.findByConversationIdOrderBySentAtDesc(
                convId, PageRequest.of(page, size));
        return msgs.getContent().stream().map(MessageResponse::from).toList();
    }

    @Transactional
    public MessageResponse sendMessage(UUID senderId, SendMessageRequest req) {
        // Idempotency: return existing message if same clientMsgId already stored
        if (req.clientMsgId() != null && !req.clientMsgId().isBlank()) {
            var existing = messageRepo.findByClientMsgId(req.clientMsgId());
            if (existing.isPresent()) return MessageResponse.from(existing.get());
        }

        ConversationEntity conv = assertParticipant(req.conversationId(), senderId);

        MessageEntity msg = new MessageEntity(req.conversationId(), senderId, req.content());
        if (req.clientMsgId() != null && !req.clientMsgId().isBlank()) {
            msg.setClientMsgId(req.clientMsgId());
        }
        messageRepo.save(msg);
        conv.setLastMessageAt(Instant.now());
        conversationRepo.save(conv);

        MessageResponse response = MessageResponse.from(msg);

        // Push to recipient via STOMP — principal name is email (matches WebSocketConfig)
        UUID recipientId = conv.getMedecinId().equals(senderId)
                ? conv.getPatientId() : conv.getMedecinId();
        User recipient = resolveById(recipientId);
        stompTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/messages", response);

        // In-app notification for recipient
        User sender = resolveById(senderId);
        String senderName = sender.getFirstName() + " " + sender.getLastName();
        notifService.push(recipientId, "MESSAGE_RECU",
                "Nouveau message de " + senderName,
                req.content().length() > 80 ? req.content().substring(0, 80) + "…" : req.content());

        return response;
    }

    @Transactional
    public void markRead(UUID convId, UUID userId) {
        assertParticipant(convId, userId);
        messageRepo.markConversationRead(convId, userId, Instant.now());
    }

    // ---- helpers ----

    private ConversationResponse toResponse(ConversationEntity c, UUID callerId) {
        User medecin = resolveById(c.getMedecinId());
        User patient = resolveById(c.getPatientId());
        long unread  = messageRepo.countUnread(c.getId(), callerId);

        Page<MessageEntity> lastPage = messageRepo.findByConversationIdOrderBySentAtDesc(
                c.getId(), PageRequest.of(0, 1));
        MessageResponse lastMsg = lastPage.isEmpty() ? null
                : MessageResponse.from(lastPage.getContent().get(0));

        return ConversationResponse.from(c,
                medecin.getFirstName() + " " + medecin.getLastName(),
                patient.getFirstName() + " " + patient.getLastName(),
                unread, lastMsg);
    }

    private ConversationEntity assertParticipant(UUID convId, UUID userId) {
        ConversationEntity conv = conversationRepo.findById(convId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found: " + convId));
        if (!conv.getMedecinId().equals(userId) && !conv.getPatientId().equals(userId)) {
            throw new SecurityException("Not a participant in conversation " + convId);
        }
        return conv;
    }

    private User resolveById(UUID userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }
}
