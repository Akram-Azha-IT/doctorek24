package ma.doctorek.doctorek.messaging;

import ma.doctorek.doctorek.entity.ConversationEntity;
import ma.doctorek.doctorek.entity.MessageEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.MessageType;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.exception.RateLimitExceededException;
import ma.doctorek.doctorek.service.MinioStorageService;
import ma.doctorek.doctorek.service.RateLimiterService;
import ma.doctorek.doctorek.messaging.dto.ConversationResponse;
import ma.doctorek.doctorek.messaging.dto.MessageResponse;
import ma.doctorek.doctorek.messaging.dto.SendMessageRequest;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.ConversationRepository;
import ma.doctorek.doctorek.repository.MessageRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.core.io.Resource;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

@Service
public class MessagingService {

    private static final Logger log = LoggerFactory.getLogger(MessagingService.class);

    // Limites messages vocaux (anti-abus + coût de stockage).
    private static final int MAX_AUDIO_DURATION_SEC = 120;               // 2 min
    private static final long MAX_AUDIO_BYTES = 6L * 1024 * 1024;        // 6 Mo (marge large sur ~300 Ko/2min Opus)
    private static final Set<String> ALLOWED_AUDIO_MIME = Set.of(
            "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac", "audio/wav");

    // Pièces jointes (documents) — allowlist stricte (pas d'exécutable/office), cap taille.
    private static final long MAX_DOC_BYTES = 10L * 1024 * 1024;         // 10 Mo
    private static final Set<String> ALLOWED_DOC_MIME = Set.of(
            "application/pdf", "image/jpeg", "image/png");

    // Anti-flood (par utilisateur, fenêtre Redis).
    private static final int  MSG_PER_MIN     = 20;                      // messages (tous types) / min
    private static final int  UPLOAD_PER_5MIN = 10;                      // uploads (audio+doc) / 5 min
    private static final int  MAX_TEXT_LEN    = 5_000;                   // caractères / message texte
    // Quota de médias par conversation (anti-remplissage disque).
    private static final int  MAX_CONV_FILES  = 50;
    private static final long MAX_CONV_BYTES  = 200L * 1024 * 1024;      // 200 Mo cumulés

    private final ConversationRepository conversationRepo;
    private final MessageRepository      messageRepo;
    private final UserRepository         userRepo;
    private final SimpMessagingTemplate  stompTemplate;
    private final NotificationService    notifService;
    private final MinioStorageService    storageService;
    private final RateLimiterService     rateLimiter;

    public MessagingService(ConversationRepository conversationRepo,
                             MessageRepository messageRepo,
                             UserRepository userRepo,
                             SimpMessagingTemplate stompTemplate,
                             NotificationService notifService,
                             MinioStorageService storageService,
                             RateLimiterService rateLimiter) {
        this.conversationRepo = conversationRepo;
        this.messageRepo      = messageRepo;
        this.userRepo         = userRepo;
        this.stompTemplate    = stompTemplate;
        this.notifService     = notifService;
        this.storageService   = storageService;
        this.rateLimiter      = rateLimiter;
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
        MessageResponse dup = findByClientMsgId(req.clientMsgId());
        if (dup != null) return dup;

        ConversationEntity conv = assertParticipant(req.conversationId(), senderId);
        assertCanSend(conv, senderId);
        // Borne texte (le canal WebSocket ne passe pas par la validation Bean).
        if (req.content() != null && req.content().length() > MAX_TEXT_LEN) {
            throw new IllegalArgumentException("Message trop long (max " + MAX_TEXT_LEN + " caractères)");
        }
        rateLimiter.checkAndIncrement("msg", senderId, MSG_PER_MIN, Duration.ofMinutes(1));

        MessageEntity msg = MessageEntity.text(req.conversationId(), senderId, req.content());
        if (req.clientMsgId() != null && !req.clientMsgId().isBlank()) {
            msg.setClientMsgId(req.clientMsgId());
        }
        String preview = req.content().length() > 80 ? req.content().substring(0, 80) + "…" : req.content();
        return persistAndDispatch(msg, conv, senderId, req.clientMsgId(), preview);
    }

    /**
     * Message vocal : valide (participant, mime, taille, durée), stocke le fichier dans MinIO
     * puis crée un message AUDIO. La clé MinIO n'est jamais exposée — le fichier se récupère
     * via l'endpoint protégé getAudio (contrôle de participation).
     */
    @Transactional
    public MessageResponse sendAudioMessage(UUID senderId, UUID conversationId,
                                            MultipartFile file, int durationSec, String clientMsgId) {
        MessageResponse dup = findByClientMsgId(clientMsgId);
        if (dup != null) return dup;

        ConversationEntity conv = assertParticipant(conversationId, senderId);
        assertCanSend(conv, senderId);

        // --- Validations de sécurité / anti-abus ---
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier audio vide");
        }
        enforceMediaLimits(conversationId, senderId, file.getSize());
        if (file.getSize() > MAX_AUDIO_BYTES) {
            throw new IllegalArgumentException("Fichier audio trop volumineux (max 6 Mo)");
        }
        if (durationSec < 1 || durationSec > MAX_AUDIO_DURATION_SEC) {
            throw new IllegalArgumentException("Durée invalide (1 à " + MAX_AUDIO_DURATION_SEC + " s)");
        }
        String rawMime = file.getContentType();
        String mime = rawMime != null ? rawMime.split(";")[0].trim() : "";
        if (!ALLOWED_AUDIO_MIME.contains(mime)) {
            throw new IllegalArgumentException("Type audio non autorisé: " + mime);
        }

        String objectKey = "messaging/" + conversationId + "/" + UUID.randomUUID();
        try {
            storageService.upload(objectKey, file);
        } catch (Exception e) {
            throw new IllegalStateException("Échec du stockage audio", e);
        }

        MessageEntity msg = MessageEntity.audio(conversationId, senderId, objectKey, durationSec, mime);
        if (clientMsgId != null && !clientMsgId.isBlank()) {
            msg.setClientMsgId(clientMsgId);
        }
        return persistAndDispatch(msg, conv, senderId, clientMsgId, "🎤 Message vocal");
    }

    /**
     * Pièce jointe : valide (participant, droit de réponse, mime pdf/jpeg/png, taille),
     * stocke dans MinIO, crée un message DOCUMENT. Fichier servi via getMedia (protégé).
     */
    @Transactional
    public MessageResponse sendDocumentMessage(UUID senderId, UUID conversationId,
                                               MultipartFile file, String clientMsgId) {
        MessageResponse dup = findByClientMsgId(clientMsgId);
        if (dup != null) return dup;

        ConversationEntity conv = assertParticipant(conversationId, senderId);
        assertCanSend(conv, senderId);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide");
        }
        if (file.getSize() > MAX_DOC_BYTES) {
            throw new IllegalArgumentException("Fichier trop volumineux (max 10 Mo)");
        }
        enforceMediaLimits(conversationId, senderId, file.getSize());
        String rawMime = file.getContentType();
        String mime = rawMime != null ? rawMime.split(";")[0].trim() : "";
        if (!ALLOWED_DOC_MIME.contains(mime)) {
            throw new IllegalArgumentException("Type de fichier non autorisé (PDF, JPEG, PNG uniquement)");
        }
        String filename = sanitizeFilename(file.getOriginalFilename());

        String objectKey = "messaging/" + conversationId + "/" + UUID.randomUUID();
        try {
            storageService.upload(objectKey, file);
        } catch (Exception e) {
            throw new IllegalStateException("Échec du stockage du fichier", e);
        }

        MessageEntity msg = MessageEntity.document(conversationId, senderId, objectKey, mime,
                filename, file.getSize());
        if (clientMsgId != null && !clientMsgId.isBlank()) {
            msg.setClientMsgId(clientMsgId);
        }
        return persistAndDispatch(msg, conv, senderId, clientMsgId, "📎 " + filename);
    }

    /** Le médecin (propriétaire) active/désactive le droit de réponse du patient. */
    @Transactional
    public ConversationResponse setPatientCanReply(UUID convId, UUID medecinId, boolean allowed) {
        ConversationEntity conv = conversationRepo.findById(convId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found: " + convId));
        if (!conv.getMedecinId().equals(medecinId)) {
            throw new SecurityException("Seul le médecin peut modifier le droit de réponse");
        }
        conv.setPatientCanReply(allowed);
        conversationRepo.save(conv);
        return toResponse(conv, medecinId);
    }

    public record MediaStream(Resource resource, String mime, String filename, boolean inline) {}

    /** Récupère le flux d'un média (audio ou document) — le caller doit être participant. */
    @Transactional(readOnly = true)
    public MediaStream getMedia(UUID messageId, UUID callerId) throws IOException {
        MessageEntity msg = messageRepo.findById(messageId)
                .orElseThrow(() -> new NoSuchElementException("Message not found: " + messageId));
        if (msg.getMediaKey() == null
                || (msg.getMessageType() != MessageType.AUDIO && msg.getMessageType() != MessageType.DOCUMENT)) {
            throw new NoSuchElementException("Pas de média pour ce message");
        }
        assertParticipant(msg.getConversationId(), callerId);
        Resource resource = storageService.download(msg.getMediaKey());
        String mime = msg.getMediaMime() != null ? msg.getMediaMime() : "application/octet-stream";
        // Audio : lecture inline. Document : téléchargement forcé (évite l'exécution d'un fichier piégé).
        boolean inline = msg.getMessageType() == MessageType.AUDIO;
        return new MediaStream(resource, mime, msg.getMediaFilename(), inline);
    }

    // ---- dispatch commun (persistance idempotente + WS + notification) ----

    private MessageResponse findByClientMsgId(String clientMsgId) {
        if (clientMsgId == null || clientMsgId.isBlank()) return null;
        return messageRepo.findByClientMsgId(clientMsgId).map(MessageResponse::from).orElse(null);
    }

    private MessageResponse persistAndDispatch(MessageEntity msg, ConversationEntity conv,
                                               UUID senderId, String clientMsgId, String notifBody) {
        try {
            messageRepo.save(msg);
        } catch (DataIntegrityViolationException e) {
            // Course sur clientMsgId : insert concurrent — on renvoie le gagnant.
            if (clientMsgId != null && !clientMsgId.isBlank()) {
                return messageRepo.findByClientMsgId(clientMsgId)
                        .map(MessageResponse::from)
                        .orElseThrow(() -> e);
            }
            throw e;
        }
        conv.setLastMessageAt(Instant.now());
        conversationRepo.save(conv);

        MessageResponse response = MessageResponse.from(msg);

        // Push STOMP au destinataire — principal = email (cf. WebSocketConfig)
        UUID recipientId = conv.getMedecinId().equals(senderId)
                ? conv.getPatientId() : conv.getMedecinId();
        User recipient = resolveById(recipientId);
        stompTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/messages", response);

        // Notification — best-effort, ne rollback jamais le message
        try {
            User sender = resolveById(senderId);
            String senderName = sender.getFirstName() + " " + sender.getLastName();
            notifService.push(recipientId, "MESSAGE_RECU",
                    "Nouveau message de " + senderName, notifBody);
        } catch (Exception e) {
            log.warn("Notification push failed for message {}: {}", response.id(), e.getMessage());
        }

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

    /**
     * Limites anti-flood pour les envois de médias : fréquence d'upload par utilisateur
     * (Redis) + quota cumulé par conversation (nombre de fichiers et octets, anti-remplissage disque).
     */
    private void enforceMediaLimits(UUID convId, UUID senderId, long newSize) {
        rateLimiter.checkAndIncrement("msg", senderId, MSG_PER_MIN, Duration.ofMinutes(1));
        rateLimiter.checkAndIncrement("upload", senderId, UPLOAD_PER_5MIN, Duration.ofMinutes(5));

        if (messageRepo.countMediaByConversation(convId) >= MAX_CONV_FILES) {
            throw new RateLimitExceededException(
                    "Limite de pièces jointes atteinte pour cette conversation (" + MAX_CONV_FILES + ").");
        }
        if (messageRepo.sumMediaSizeByConversation(convId) + newSize > MAX_CONV_BYTES) {
            throw new RateLimitExceededException(
                    "Espace de pièces jointes saturé pour cette conversation.");
        }
    }

    /** Le patient ne peut envoyer que si le médecin l'a autorisé sur cette conversation. */
    private void assertCanSend(ConversationEntity conv, UUID senderId) {
        boolean isPatient = conv.getPatientId().equals(senderId);
        if (isPatient && !conv.isPatientCanReply()) {
            throw new SecurityException("Le médecin a désactivé les réponses sur cette conversation");
        }
    }

    /** Retire tout composant de chemin — on ne garde qu'un nom de fichier plat et borné. */
    private String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) return "document";
        // Retire tout composant de chemin sans regex à retour arrière (perf).
        int sep = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        String base = (sep >= 0 ? name.substring(sep + 1) : name)
                .replace("\r", "").replace("\n", "").replace("\t", "").trim();
        if (base.isBlank()) return "document";
        return base.length() > 200 ? base.substring(0, 200) : base;
    }

    private User resolveById(UUID userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }
}
