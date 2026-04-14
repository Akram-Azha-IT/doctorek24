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
    LocalDateTime createdAt
) {
    public RendezVous annuler() {
        return new RendezVous(id, medecinId, patientId, dateRdv, heureRdv,
                              duree, StatutRdv.ANNULE, motif, createdAt);
    }
}