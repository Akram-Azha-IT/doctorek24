package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "agenda", name = "rdv_documents_requis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RdvDocumentRequisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rdv_id", nullable = false)
    private UUID rdvId;

    @Column(nullable = false, length = 255)
    private String libelle;

    @Column(nullable = false)
    private boolean fourni;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
