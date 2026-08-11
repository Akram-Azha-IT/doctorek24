package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Avis d'un patient sur un médecin, adossé à un rendez-vous terminé.
 *
 * <p>Le lien vers le rendez-vous n'est pas décoratif : c'est lui qui atteste que la
 * consultation a eu lieu, et l'unicité porte sur lui — un patient qui revoit le même
 * médecin peut redonner son avis.
 */
@Entity
@Table(schema = "annuaire", name = "avis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "medecin_id", nullable = false)
    private UUID medecinId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "rdv_id", nullable = false)
    private UUID rdvId;

    @Column(nullable = false)
    private short note;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    /** Choix du patient au dépôt : son nom s'affiche, ou « Patient vérifié ». */
    @Column(nullable = false)
    private boolean anonyme;

    @Column(nullable = false, length = 20)
    private String statut;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (statut == null) statut = "PUBLIE";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
