package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(schema = "agenda", name = "rendez_vous")
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

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public RendezVousEntity() {}

    public UUID getId()                  { return id; }
    public void setId(UUID id)           { this.id = id; }

    public UUID getMedecinId()           { return medecinId; }
    public void setMedecinId(UUID v)     { this.medecinId = v; }

    public UUID getPatientId()           { return patientId; }
    public void setPatientId(UUID v)     { this.patientId = v; }

    public LocalDate getDateRdv()        { return dateRdv; }
    public void setDateRdv(LocalDate v)  { this.dateRdv = v; }

    public LocalTime getHeureRdv()       { return heureRdv; }
    public void setHeureRdv(LocalTime v) { this.heureRdv = v; }

    public int getDuree()                { return duree; }
    public void setDuree(int v)          { this.duree = v; }

    public String getStatut()            { return statut; }
    public void setStatut(String v)      { this.statut = v; }

    public String getMotif()             { return motif; }
    public void setMotif(String v)       { this.motif = v; }

    public String getQuestionnaireJson()        { return questionnaireJson; }
    public void setQuestionnaireJson(String v)  { this.questionnaireJson = v; }

    public LocalDateTime getCreatedAt()         { return createdAt; }
    public void setCreatedAt(LocalDateTime v)   { this.createdAt = v; }
}
