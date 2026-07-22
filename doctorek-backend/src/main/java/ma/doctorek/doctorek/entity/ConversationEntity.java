package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(schema = "messaging", name = "conversation")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConversationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "medecin_id", nullable = false)
    private UUID medecinId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    // Le médecin peut désactiver les réponses du patient sur cette conversation.
    @Column(name = "patient_can_reply", nullable = false)
    private boolean patientCanReply = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ConversationEntity(UUID medecinId, UUID patientId) {
        this.medecinId = medecinId;
        this.patientId = patientId;
    }

    @PrePersist
    private void prePersist() {
        this.createdAt = Instant.now();
    }
}
