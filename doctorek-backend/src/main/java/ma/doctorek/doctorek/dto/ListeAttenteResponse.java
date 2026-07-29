package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.ListeAttenteEntity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Inscription d'un patient en liste d'attente chez un médecin. */
public record ListeAttenteResponse(
        UUID id,
        UUID medecinId,
        UUID patientId,
        LocalDate dateDebut,
        LocalDate dateFin,
        String statut,
        Instant createdAt) {

    public static ListeAttenteResponse from(ListeAttenteEntity e) {
        return new ListeAttenteResponse(
            e.getId(), e.getMedecinId(), e.getPatientId(),
            e.getDateDebut(), e.getDateFin(), e.getStatut(), e.getCreatedAt());
    }
}
