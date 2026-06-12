package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "documents_medicaux")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentMedicalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "type_doc", nullable = false)
    private String typeDoc;

    @Column(name = "chemin", nullable = false)
    private String chemin;

    @Column(name = "taille")
    private Long taille;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
