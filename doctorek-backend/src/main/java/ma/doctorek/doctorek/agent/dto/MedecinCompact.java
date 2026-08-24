package ma.doctorek.doctorek.agent.dto;

import ma.doctorek.doctorek.dto.MedecinProfile;

import java.util.UUID;

/**
 * Projection d'un médecin destinée au modèle.
 *
 * <p>Volontairement pauvre : le modèle a besoin de l'identifiant pour enchaîner
 * sur les créneaux, et de quoi distinguer les praticiens entre eux. L'adresse,
 * les coordonnées GPS, la photo et l'INPE partent dans la carte affichée au
 * patient, pas dans le prompt — ils gonfleraient le contexte sans changer une
 * seule décision du modèle.
 */
public record MedecinCompact(
        UUID id,
        String nom,
        String specialite,
        String ville,
        Double note,
        Double distanceKm) {

    public static MedecinCompact from(MedecinProfile profil, Double note, Double distanceKm) {
        return new MedecinCompact(
                profil.id(),
                "Dr " + profil.firstName() + " " + profil.lastName(),
                profil.specialite(),
                profil.ville(),
                note,
                distanceKm);
    }
}
