package ma.doctorek.doctorek.dossier.infrastructure;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import ma.doctorek.doctorek.dossier.domain.Medicament;
import ma.doctorek.doctorek.dossier.domain.Ordonnance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(schema = "dossier", name = "ordonnances")
class OrdonnanceEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "medecin_id", nullable = false)
    private UUID medecinId;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "medicaments", columnDefinition = "TEXT", nullable = false)
    private String medicamentsJson;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    OrdonnanceEntity() {}

    static OrdonnanceEntity fromDomain(Ordonnance domain) {
        var entity = new OrdonnanceEntity();
        entity.id = domain.id();
        entity.patientId = domain.patientId();
        entity.medecinId = domain.medecinId();
        entity.dateEmission = domain.dateEmission() != null ? domain.dateEmission() : LocalDate.now();
        entity.notes = domain.notes();
        entity.createdAt = LocalDateTime.now();
        try {
            entity.medicamentsJson = MAPPER.writeValueAsString(
                domain.medicaments() != null ? domain.medicaments() : List.of()
            );
        } catch (Exception e) {
            entity.medicamentsJson = "[]";
        }
        return entity;
    }

    Ordonnance toDomain() {
        List<Medicament> medicaments;
        try {
            medicaments = MAPPER.readValue(
                medicamentsJson != null ? medicamentsJson : "[]",
                new TypeReference<List<Medicament>>() {}
            );
        } catch (Exception e) {
            medicaments = List.of();
        }
        return new Ordonnance(id, patientId, medecinId, dateEmission, medicaments, notes);
    }
}
