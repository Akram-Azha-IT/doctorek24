package ma.doctorek.doctorek.dto;

import java.util.UUID;

/**
 * Note synthétique d'un médecin pour les cartes de résultats.
 *
 * <p>Volontairement hors de {@code MedecinProfile} : le profil est servi depuis un cache
 * Redis, la note y deviendrait périmée dès le premier avis déposé.
 */
public record NoteMedecinResponse(UUID medecinId, double noteMoyenne, long nombreAvis) {
}
