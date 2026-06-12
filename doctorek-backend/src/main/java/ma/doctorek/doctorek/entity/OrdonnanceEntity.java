package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "ordonnances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdonnanceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "medecin_id")
    private UUID medecinId;

    @Builder.Default
    @Column(name = "source", nullable = false, length = 20)
    private String source = "MEDECIN";

    @Column(name = "medecin_nom")
    private String medecinNom;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "medicaments", columnDefinition = "jsonb", nullable = false)
    private String medicamentsJson;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "fichier_chemin")
    private String fichierChemin;

    @Column(name = "fichier_nom")
    private String fichierNom;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
