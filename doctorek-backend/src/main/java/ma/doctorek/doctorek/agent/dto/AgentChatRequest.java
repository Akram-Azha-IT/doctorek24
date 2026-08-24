package ma.doctorek.doctorek.agent.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Question du patient.
 *
 * @param conversationId identifiant de fil, renvoyé par la réponse précédente.
 *                       Absent au premier message : le serveur en crée un.
 * @param message        question en langage naturel. Plafonnée : un prompt long
 *                       coûte des jetons et n'améliore pas la sélection d'outils.
 * @param latitude       position du patient, facultative. Fournie par le
 *                       navigateur, jamais déduite par le modèle : elle
 *                       conditionne la recherche de proximité.
 * @param longitude      voir {@link #latitude}
 */
public record AgentChatRequest(
        @Size(max = 64) String conversationId,
        @NotBlank @Size(max = 500) String message,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude) {
}
