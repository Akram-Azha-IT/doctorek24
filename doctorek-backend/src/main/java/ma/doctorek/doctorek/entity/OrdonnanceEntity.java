package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "ordonnances")
public class OrdonnanceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "medecin_id", nullable = false)
    private UUID medecinId;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "medicaments", columnDefinition = "jsonb", nullable = false)
    private String medicamentsJson;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public OrdonnanceEntity() {}

    public UUID getId()                         { return id; }
    public void setId(UUID v)                   { this.id = v; }

    public UUID getPatientId()                  { return patientId; }
    public void setPatientId(UUID v)            { this.patientId = v; }

    public UUID getMedecinId()                  { return medecinId; }
    public void setMedecinId(UUID v)            { this.medecinId = v; }

    public LocalDate getDateEmission()          { return dateEmission; }
    public void setDateEmission(LocalDate v)    { this.dateEmission = v; }

    public String getMedicamentsJson()          { return medicamentsJson; }
    public void setMedicamentsJson(String v)    { this.medicamentsJson = v; }

    public String getNotes()                    { return notes; }
    public void setNotes(String v)              { this.notes = v; }

    public LocalDateTime getCreatedAt()         { return createdAt; }
    public void setCreatedAt(LocalDateTime v)   { this.createdAt = v; }
}
