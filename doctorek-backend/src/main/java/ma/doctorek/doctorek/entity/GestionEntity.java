package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.doctorek.doctorek.enums.RoleGestion;

import java.time.Instant;
import java.util.UUID;

/**
 * Relation de gestion : un compte (gestionnaire) gère un patient (proche).
 * Many-to-many — un patient peut être géré par plusieurs comptes.
 */
@Entity
@Table(schema = "patient", name = "gestion")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "gestionnaire_compte_id", nullable = false)
    private UUID gestionnaireCompteId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private RoleGestion role;

    @Column(name = "declaration_representant_legal", nullable = false)
    private boolean declarationRepresentantLegal;

    @Column(name = "actif", nullable = false)
    private boolean actif = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public GestionEntity(UUID gestionnaireCompteId, UUID patientId,
                         RoleGestion role, boolean declarationRepresentantLegal) {
        this.gestionnaireCompteId = gestionnaireCompteId;
        this.patientId = patientId;
        this.role = role;
        this.declarationRepresentantLegal = declarationRepresentantLegal;
        this.actif = true;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
