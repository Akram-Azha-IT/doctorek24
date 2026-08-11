package ma.doctorek.doctorek.dto;

/**
 * État du consentement de l'appelant.
 *
 * <p>Servi par un appel dédié plutôt que porté par la session : la session est un jeton
 * figé jusqu'au prochain rafraîchissement, l'écran continuerait donc de réclamer un accord
 * déjà donné.
 */
public record ConsentementStatutResponse(boolean requis, String version) {
}
