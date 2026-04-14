package ma.doctorek.doctorek.agenda.application.dto;

import ma.doctorek.doctorek.agenda.domain.RendezVous;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RendezVousResponse(
    UUID      id,
    UUID      medecinId,
    UUID      patientId,
    LocalDate dateRdv,
    LocalTime heureRdv,
    int       duree,
    String    statut,
    String    motif
) {
    public static RendezVousResponse from(RendezVous rdv) {
        return new RendezVousResponse(
            rdv.id(),
            rdv.medecinId(),
            rdv.patientId(),
            rdv.dateRdv(),
            rdv.heureRdv(),
            rdv.duree(),
            rdv.statut().name(),
            rdv.motif()
        );
    }
}