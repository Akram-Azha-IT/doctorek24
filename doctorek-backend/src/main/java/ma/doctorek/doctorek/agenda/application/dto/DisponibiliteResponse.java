package ma.doctorek.doctorek.agenda.application.dto;

import ma.doctorek.doctorek.agenda.domain.Disponibilite;

import java.util.UUID;

public record DisponibiliteResponse(
    UUID   id,
    String jourSemaine,
    String heureDebut,
    String heureFin,
    int    dureeConsultation,
    String frequence,
    int    intervalSemaines,
    String dateDebut,
    String typeFinRecurrence,
    String dateFin
) {
    public static DisponibiliteResponse from(Disponibilite d) {
        return new DisponibiliteResponse(
            d.id(),
            d.jourSemaine().name(),
            d.heureDebut().toString(),
            d.heureFin().toString(),
            d.dureeConsultation(),
            d.frequence().name(),
            d.intervalSemaines(),
            d.dateDebut() != null ? d.dateDebut().toString() : null,
            d.typeFinRecurrence().name(),
            d.dateFin() != null ? d.dateFin().toString() : null
        );
    }
}
