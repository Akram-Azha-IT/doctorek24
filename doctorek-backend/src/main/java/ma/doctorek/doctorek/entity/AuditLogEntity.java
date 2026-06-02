package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_log", schema = "carte")
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "card_id", nullable = false)
    private UUID cardId;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "changed_by")
    private UUID changedBy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_value", columnDefinition = "jsonb")
    private String oldValue;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_value", columnDefinition = "jsonb")
    private String newValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }

    public UUID getCardId() { return cardId; }
    public void setCardId(UUID v) { this.cardId = v; }

    public String getAction() { return action; }
    public void setAction(String v) { this.action = v; }

    public UUID getChangedBy() { return changedBy; }
    public void setChangedBy(UUID v) { this.changedBy = v; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String v) { this.oldValue = v; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String v) { this.newValue = v; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
