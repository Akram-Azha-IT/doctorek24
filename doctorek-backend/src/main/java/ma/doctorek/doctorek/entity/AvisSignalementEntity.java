package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Signalement d'un avis par un compte.
 *
 * <p>La clé porte le couple (avis, auteur) : un même compte ne fait pas monter le
 * compteur en boucle. Le nombre de signalements se lit, il n'est pas stocké.
 */
@Entity
@Table(schema = "annuaire", name = "avis_signalement")
@IdClass(AvisSignalementEntity.Cle.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvisSignalementEntity {

    @Id
    @Column(name = "avis_id", nullable = false)
    private UUID avisId;

    @Id
    @Column(name = "auteur_id", nullable = false)
    private UUID auteurId;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    /** Clé composite JPA — requise par {@link IdClass}. */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Cle implements Serializable {
        private UUID avisId;
        private UUID auteurId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Cle autre)) return false;
            return Objects.equals(avisId, autre.avisId) && Objects.equals(auteurId, autre.auteurId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(avisId, auteurId);
        }
    }
}
