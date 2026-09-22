package ma.doctorek.doctorek.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "push_installation", schema = "notif")
@Getter @Setter @NoArgsConstructor
public class PushInstallationEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "installation_id", nullable = false, unique = true) private UUID installationId;
    @Column(nullable = false, length = 16) private String platform;
    @Column(nullable = false, length = 16) private String environment;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "token_ciphertext", nullable = false) private String tokenCiphertext;
    @Column(nullable = false) private boolean enabled = true;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "last_seen_at", nullable = false) private Instant lastSeenAt;

    @PrePersist void create() { Instant now = Instant.now(); createdAt = now; updatedAt = now; lastSeenAt = now; }
    @PreUpdate void update() { updatedAt = Instant.now(); }
}
