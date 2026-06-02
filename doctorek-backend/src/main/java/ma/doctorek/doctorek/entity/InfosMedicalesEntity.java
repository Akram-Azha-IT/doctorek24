package ma.doctorek.doctorek.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "infos_medicales")
public class InfosMedicalesEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @Column(name = "patient_id")
    private UUID patientId;

    @Column(name = "groupe_sanguin")
    private String groupeSanguin;

    @Column(name = "allergies", columnDefinition = "jsonb")
    private String allergiesJson;

    @Column(name = "antecedents", columnDefinition = "TEXT")
    private String antecedents;

    @Column(name = "traitements_cours", columnDefinition = "TEXT")
    private String traitementsCours;

    @Column(name = "notes_generales", columnDefinition = "TEXT")
    private String notesGenerales;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public InfosMedicalesEntity() {}

    public UUID getPatientId()                    { return patientId; }
    public void setPatientId(UUID v)              { this.patientId = v; }

    public String getGroupeSanguin()              { return groupeSanguin; }
    public void setGroupeSanguin(String v)        { this.groupeSanguin = v; }

    public String getAllergiesJson()              { return allergiesJson; }
    public void setAllergiesJson(String v)        { this.allergiesJson = v; }

    public List<String> getAllergies() {
        try {
            return MAPPER.readValue(
                    allergiesJson != null ? allergiesJson : "[]",
                    new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    public void setAllergies(List<String> allergies) {
        try {
            this.allergiesJson = MAPPER.writeValueAsString(
                    allergies != null ? allergies : List.of());
        } catch (Exception e) {
            this.allergiesJson = "[]";
        }
    }

    public String getAntecedents()                { return antecedents; }
    public void setAntecedents(String v)          { this.antecedents = v; }

    public String getTraitementsCours()           { return traitementsCours; }
    public void setTraitementsCours(String v)     { this.traitementsCours = v; }

    public String getNotesGenerales()             { return notesGenerales; }
    public void setNotesGenerales(String v)       { this.notesGenerales = v; }

    public LocalDateTime getUpdatedAt()           { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v)     { this.updatedAt = v; }
}
