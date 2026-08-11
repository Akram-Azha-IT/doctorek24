package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Trace d'un consentement au traitement des données (loi 09-08).
 *
 * <p>Immuable : un consentement se retire en enregistrant un nouvel état, jamais en
 * modifiant la ligne existante. Une preuve réécrite n'est plus une preuve.
 */
@Entity
@Table(schema = "auth", name = "consentement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Version du texte accepté : un texte modifié doit être réaccepté. */
    @Column(nullable = false, length = 32)
    private String version;

    /** INSCRIPTION ou CONNEXION, selon l'écran où l'accord a été donné. */
    @Column(nullable = false, length = 20)
    private String source;

    @Column(name = "accepte_at", nullable = false)
    private Instant accepteAt;

    @PrePersist
    void horodater() {
        if (accepteAt == null) accepteAt = Instant.now();
    }
}
