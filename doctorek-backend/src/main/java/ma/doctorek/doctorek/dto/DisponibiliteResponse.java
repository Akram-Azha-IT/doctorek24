package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.DisponibiliteEntity;

import java.util.UUID;

public record DisponibiliteResponse(
        UUID id,
        String jourSemaine,
        String heureDebut,
        String heureFin,
        int dureeConsultation,
        String frequence,
        int intervalSemaines,
        String dateDebut,
        String typeFinRecurrence,
        String dateFin) {

    public static DisponibiliteResponse from(DisponibiliteEntity d) {
        return new DisponibiliteResponse(
                d.getId(),
                d.getJourSemaine(),
                d.getHeureDebut() != null ? d.getHeureDebut().toString() : null,
                d.getHeureFin() != null ? d.getHeureFin().toString() : null,
                d.getDureeConsultation(),
                d.getFrequence(),
                d.getIntervalSemaines(),
                d.getDateDebut() != null ? d.getDateDebut().toString() : null,
                d.getTypeFinRecurrence(),
                d.getDateFin() != null ? d.getDateFin().toString() : null);
    }
}
