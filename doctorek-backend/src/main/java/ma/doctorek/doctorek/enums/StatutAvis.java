package ma.doctorek.doctorek.enums;

/**
 * Cycle de vie d'un avis.
 *
 * <p>La publication est immédiate : un avis n'attend pas de validation. Le signalement
 * ne le retire donc pas de la vue publique, il le pousse en tête de la file de modération
 * ({@code SIGNALE}) ; seul un administrateur le retire ({@code MASQUE}).
 */
public enum StatutAvis {
    PUBLIE,
    SIGNALE,
    MASQUE
}
