package ma.doctorek.doctorek.agenda.infrastructure;

import jakarta.persistence.*;
import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(schema = "agenda", name = "rendez_vous")
class RendezVousEntity {

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

    @Column(name = "questionnaire_json", columnDefinition = "jsonb")
    private String questionnaireJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected RendezVousEntity() {}

    RendezVous toDomain() {
        return new RendezVous(
            id,
            medecinId,
            patientId,
            dateRdv,
            heureRdv,
            duree,
            StatutRdv.valueOf(statut),
            motif,
            questionnaireJson,
            createdAt
        );
    }

    static RendezVousEntity fromDomain(RendezVous rdv) {
        RendezVousEntity e = new RendezVousEntity();
        e.id                = rdv.id();
        e.medecinId         = rdv.medecinId();
        e.patientId         = rdv.patientId();
        e.dateRdv           = rdv.dateRdv();
        e.heureRdv          = rdv.heureRdv();
        e.duree             = rdv.duree();
        e.statut            = rdv.statut().name();
        e.motif             = rdv.motif();
        e.questionnaireJson = rdv.questionnaireJson();
        e.createdAt         = rdv.createdAt() != null ? rdv.createdAt() : LocalDateTime.now();
        return e;
    }
}
