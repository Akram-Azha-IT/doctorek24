package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(schema = "agenda", name = "rendez_vous")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RendezVousEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "medecin_id", nullable = false)
    private UUID medecinId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "date_rdv", nullable = false)
    private LocalDate dateRdv;

    @Column(name = "heure_rdv", nullable = false)
    private LocalTime heureRdv;

    @Column(nullable = false)
    private int duree;

    @Column(nullable = false, length = 20)
    private String statut;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "questionnaire_json", columnDefinition = "jsonb")
    private String questionnaireJson;

    /** Compte ayant réservé : le patient, le titulaire qui gère le proche, ou le médecin. */
    @Column(name = "cree_par")
    private UUID creePar;

    /**
     * Horodatage du rappel J-0 déjà envoyé.
     *
     * <p>La tâche balaie une fenêtre de plusieurs minutes pour survivre à un tick manqué ;
     * sans cette marque, chaque passage renverrait le même rappel.
     */
    @Column(name = "rappel_30min_envoye_at")
    private Instant rappel30minEnvoyeAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
