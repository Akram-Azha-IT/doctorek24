package ma.doctorek.doctorek.agent.dto;

import ma.doctorek.doctorek.dto.MedecinProfile;

/**
 * Médecin tel qu'affiché dans le fil : profil complet, note agrégée, distance.
 *
 * <p>Reprend exactement les données que consomme déjà la carte de résultats de
 * la recherche côté frontend, pour que l'assistant réutilise le composant
 * existant plutôt que d'en introduire un second.
 */
public record MedecinCarte(
        MedecinProfile profil,
        Double noteMoyenne,
        Long nombreAvis,
        Double distanceKm) {
}
