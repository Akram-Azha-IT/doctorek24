package ma.doctorek.doctorek.agent.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Proposition de rendez-vous. <strong>Rien n'est écrit en base.</strong>
 *
 * <p>L'assistant s'arrête ici : le frontend ouvre le tiroir de réservation
 * existant, pré-rempli avec ces valeurs et modifiables, et c'est le patient qui
 * déclenche {@code POST /api/v1/agenda/rdv}. Le chemin de réservation éprouvé
 * (contrôle compte famille, questionnaire, e-mail de confirmation, notification
 * du praticien) reste l'unique voie d'écriture.
 *
 * @param creneauLibre faux si le créneau demandé n'existe pas ou est déjà pris ;
 *                     le motif est alors dans {@code indisponibilite}
 */
public record RdvBrouillon(
        UUID medecinId,
        String medecinNom,
        UUID patientId,
        LocalDate date,
        LocalTime heure,
        int dureeMinutes,
        String motif,
        boolean creneauLibre,
        String indisponibilite) {

    public static RdvBrouillon indisponible(UUID medecinId, String medecinNom,
                                            LocalDate date, LocalTime heure, String raison) {
        return new RdvBrouillon(medecinId, medecinNom, null, date, heure, 0, null, false, raison);
    }
}
