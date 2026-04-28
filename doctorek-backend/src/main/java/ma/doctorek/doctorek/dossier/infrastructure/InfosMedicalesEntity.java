package ma.doctorek.doctorek.dossier.infrastructure;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import ma.doctorek.doctorek.dossier.domain.InfosMedicales;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "infos_medicales")
class InfosMedicalesEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @Column(name = "patient_id")
    private UUID patientId;

    @Column(name = "groupe_sanguin")
    private String groupeSanguin;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergiesJson;

    @Column(name = "antecedents", columnDefinition = "TEXT")
    private String antecedents;

    @Column(name = "traitements_cours", columnDefinition = "TEXT")
    private String traitementsCours;

    @Column(name = "notes_generales", columnDefinition = "TEXT")
    private String notesGenerales;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    InfosMedicalesEntity() {}

    static InfosMedicalesEntity fromDomain(InfosMedicales domain) {
        var entity = new InfosMedicalesEntity();
        entity.patientId = domain.patientId();
        entity.groupeSanguin = domain.groupeSanguin();
        entity.antecedents = domain.antecedents();
        entity.traitementsCours = domain.traitementsCours();
        entity.notesGenerales = domain.notesGenerales();
        entity.updatedAt = LocalDateTime.now();
        try {
            entity.allergiesJson = MAPPER.writeValueAsString(
                domain.allergies() != null ? domain.allergies() : List.of()
            );
        } catch (Exception e) {
            entity.allergiesJson = "[]";
        }
        return entity;
    }

    InfosMedicales toDomain() {
        List<String> allergies;
        try {
            allergies = MAPPER.readValue(
                allergiesJson != null ? allergiesJson : "[]",
                new TypeReference<List<String>>() {}
            );
        } catch (Exception e) {
            allergies = List.of();
        }
        return new InfosMedicales(patientId, groupeSanguin, allergies, antecedents, traitementsCours, notesGenerales);
    }
}
