package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "client_msg_id", unique = true)
    private String clientMsgId;

    public MessageEntity(UUID conversationId, UUID senderId, String content) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.content = content;
    }

    @PrePersist
    private void prePersist() {
        this.sentAt = Instant.now();
    }

    public void markRead() {
        if (this.readAt == null) this.readAt = Instant.now();
    }
}
