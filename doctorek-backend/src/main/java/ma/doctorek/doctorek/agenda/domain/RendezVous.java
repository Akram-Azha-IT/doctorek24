package ma.doctorek.doctorek.agenda.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public record RendezVous(
    UUID          id,
    UUID          medecinId,
    UUID          patientId,
    LocalDate     dateRdv,
    LocalTime     heureRdv,
    int           duree,
    StatutRdv     statut,
    String        motif,
    String        questionnaireJson,
    LocalDateTime createdAt
) {
    public RendezVous annuler() {
        return new RendezVous(id, medecinId, patientId, dateRdv, heureRdv,
                              duree, StatutRdv.ANNULE, motif, questionnaireJson, createdAt);
    }

    public RendezVous confirmer() {
        return new RendezVous(id, medecinId, patientId, dateRdv, heureRdv,
                              duree, StatutRdv.CONFIRME, motif, questionnaireJson, createdAt);
    }

    public RendezVous terminer() {
        return new RendezVous(id, medecinId, patientId, dateRdv, heureRdv,
                              duree, StatutRdv.TERMINE, motif, questionnaireJson, createdAt);
    }

    public RendezVous reprogrammer(LocalDate newDate, LocalTime newHeure) {
        return new RendezVous(id, medecinId, patientId, newDate, newHeure,
                              duree, StatutRdv.EN_ATTENTE, motif, questionnaireJson, createdAt);
    }
}
