package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.doctorek.doctorek.enums.MessageType;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(schema = "messaging", name = "message")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType = MessageType.TEXT;

    // Présent pour TEXT ; null pour AUDIO.
    @Column(columnDefinition = "TEXT")
    private String content;

    // Champs AUDIO (null pour TEXT). media_key = clé de l'objet MinIO.
    @Column(name = "media_key")
    private String mediaKey;

    @Column(name = "media_duration_sec")
    private Integer mediaDurationSec;

    @Column(name = "media_mime")
    private String mediaMime;

    // DOCUMENT : nom d'origine + taille (octets). null pour TEXT/AUDIO.
    @Column(name = "media_filename")
    private String mediaFilename;

    @Column(name = "media_size")
    private Long mediaSize;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "client_msg_id", unique = true)
    private String clientMsgId;

    private MessageEntity(UUID conversationId, UUID senderId, MessageType type) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.messageType = type;
    }

    public static MessageEntity text(UUID conversationId, UUID senderId, String content) {
        MessageEntity m = new MessageEntity(conversationId, senderId, MessageType.TEXT);
        m.content = content;
        return m;
    }

    public static MessageEntity audio(UUID conversationId, UUID senderId,
                                      String mediaKey, int durationSec, String mediaMime) {
        MessageEntity m = new MessageEntity(conversationId, senderId, MessageType.AUDIO);
        m.mediaKey = mediaKey;
        m.mediaDurationSec = durationSec;
        m.mediaMime = mediaMime;
        return m;
    }

    public static MessageEntity document(UUID conversationId, UUID senderId,
                                         String mediaKey, String mediaMime,
                                         String mediaFilename, long mediaSize) {
        MessageEntity m = new MessageEntity(conversationId, senderId, MessageType.DOCUMENT);
        m.mediaKey = mediaKey;
        m.mediaMime = mediaMime;
        m.mediaFilename = mediaFilename;
        m.mediaSize = mediaSize;
        return m;
    }

    @PrePersist
    private void prePersist() {
        this.sentAt = Instant.now();
    }

    public void markRead() {
        if (this.readAt == null) this.readAt = Instant.now();
    }
}
