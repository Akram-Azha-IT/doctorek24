package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "documents_medicaux")
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

    public DocumentMedicalEntity() {}

    public UUID getId()                       { return id; }
    public void setId(UUID v)                 { this.id = v; }

    public UUID getPatientId()                { return patientId; }
    public void setPatientId(UUID v)          { this.patientId = v; }

    public String getNom()                    { return nom; }
    public void setNom(String v)              { this.nom = v; }

    public String getTypeDoc()                { return typeDoc; }
    public void setTypeDoc(String v)          { this.typeDoc = v; }

    public String getChemin()                 { return chemin; }
    public void setChemin(String v)           { this.chemin = v; }

    public Long getTaille()                   { return taille; }
    public void setTaille(Long v)             { this.taille = v; }

    public LocalDateTime getCreatedAt()       { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
