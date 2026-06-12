package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cartes_virtuelles", schema = "carte")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarteVirtuelleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false, unique = true)
    private UUID patientId;

    @Column(name = "card_ref", nullable = false, unique = true)
    private String cardRef;

    @Builder.Default
    @Column(name = "statut", nullable = false)
    private String statut = "VIRTUEL";

    @Column(name = "groupe_sanguin")
    private String groupeSanguin;

    @Column(name = "taille_cm")
    private Integer tailleCm;

    @Column(name = "poids_kg")
    private BigDecimal poidsKg;

    @Builder.Default
    @Column(name = "donneur_organes")
    private Boolean donneurOrganes = false;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "maladies_chroniques", columnDefinition = "TEXT")
    private String maladiesChroniques;

    @Column(name = "medicaments_actuels", columnDefinition = "TEXT")
    private String medicamentsActuels;

    @Column(name = "antecedents_chirurgicaux", columnDefinition = "TEXT")
    private String antecedentsChirurgicaux;

    @Column(name = "vaccinations", columnDefinition = "TEXT")
    private String vaccinations;

    @Column(name = "antecedents_familiaux", columnDefinition = "TEXT")
    private String antecedentsFamiliaux;

    @Column(name = "contacts_urgence", columnDefinition = "TEXT")
    private String contactsUrgence;

    @Column(name = "medecin_traitant", columnDefinition = "TEXT")
    private String medecinTraitant;

    @Column(name = "assurance_nom")
    private String assuranceNom;

    @Column(name = "assurance_numero", columnDefinition = "TEXT")
    private String assuranceNumero;

    @Column(name = "assurance_details", columnDefinition = "TEXT")
    private String assuranceDetails;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
