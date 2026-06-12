package ma.doctorek.doctorek.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "infos_medicales")
@Getter
@Setter
@NoArgsConstructor
public class InfosMedicalesEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @Column(name = "patient_id")
    private UUID patientId;

    @Column(name = "groupe_sanguin")
    private String groupeSanguin;

    @JdbcTypeCode(SqlTypes.JSON)
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
}
