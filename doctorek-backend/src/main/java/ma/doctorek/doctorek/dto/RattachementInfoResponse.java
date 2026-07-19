package ma.doctorek.doctorek.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Infos publiques d'un token de rattachement — volontairement masquées :
 * jamais le nom complet du patient (le nom est le secret de vérification).
 */
public record RattachementInfoResponse(
        String medecinNom,
        LocalDate dateRdv,
        LocalTime heureRdv,
        String prenomInitiale,
        boolean expire,
        boolean utilise) {
}
