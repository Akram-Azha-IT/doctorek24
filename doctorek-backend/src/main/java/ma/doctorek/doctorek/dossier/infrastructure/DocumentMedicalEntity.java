package ma.doctorek.doctorek.dossier.infrastructure;

import jakarta.persistence.*;
import ma.doctorek.doctorek.dossier.domain.DocumentMedical;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "documents_medicaux")
class DocumentMedicalEntity {

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

    DocumentMedicalEntity() {}

    static DocumentMedicalEntity fromDomain(DocumentMedical domain) {
        var entity = new DocumentMedicalEntity();
        entity.id = domain.id();
        entity.patientId = domain.patientId();
        entity.nom = domain.nom();
        entity.typeDoc = domain.typeDoc();
        entity.chemin = domain.chemin();
        entity.taille = domain.taille();
        entity.createdAt = domain.createdAt() != null ? domain.createdAt() : LocalDateTime.now();
        return entity;
    }

    DocumentMedical toDomain() {
        return new DocumentMedical(id, patientId, nom, typeDoc, chemin, taille, createdAt);
    }
}
