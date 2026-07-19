package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Token de rattachement d'un patient créé par le praticien (sans compte)
 * au compte famille d'un titulaire. Usage unique, expiration, tentatives limitées.
 */
@Entity
@Table(schema = "patient", name = "rattachement_token")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RattachementTokenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "token")
    private UUID token;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "rdv_id")
    private UUID rdvId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "tentatives", nullable = false)
    private int tentatives;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public RattachementTokenEntity(UUID patientId, UUID rdvId, Instant expiresAt) {
        this.patientId = patientId;
        this.rdvId = rdvId;
        this.expiresAt = expiresAt;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now();
    }

    public boolean estExpire() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean estUtilise() {
        return usedAt != null;
    }
}
