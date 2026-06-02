package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(schema = "messaging", name = "conversation")
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

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ConversationEntity() {}

    public ConversationEntity(UUID medecinId, UUID patientId) {
        this.medecinId = medecinId;
        this.patientId = patientId;
    }

    @PrePersist
    private void prePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId()             { return id; }
    public UUID getMedecinId()      { return medecinId; }
    public UUID getPatientId()      { return patientId; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public Instant getCreatedAt()   { return createdAt; }

    public void setLastMessageAt(Instant lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }
}
