package ma.doctorek.doctorek.agenda.application.dto;

import ma.doctorek.doctorek.agenda.domain.Disponibilite;

import java.util.UUID;

public record DisponibiliteResponse(
    UUID   id,
    String jourSemaine,
    String heureDebut,
    String heureFin,
    int    dureeConsultation
) {
    public static DisponibiliteResponse from(Disponibilite d) {
        return new DisponibiliteResponse(
            d.id(),
            d.jourSemaine().name(),
            d.heureDebut().toString(),
            d.heureFin().toString(),
            d.dureeConsultation()
        );
    }
}
