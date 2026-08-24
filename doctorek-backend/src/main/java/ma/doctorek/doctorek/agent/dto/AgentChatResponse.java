package ma.doctorek.doctorek.agent.dto;

import java.util.List;

/**
 * Réponse d'un tour : une phrase écrite par le modèle, et les blocs riches
 * assemblés à partir des retours réels des outils.
 *
 * @param conversationId à renvoyer tel quel au message suivant
 * @param texte          une à deux phrases. Le détail est dans les cartes
 * @param cartes         dans l'ordre d'appel des outils
 * @param outilsAppeles  noms des outils utilisés, pour la trace affichée et l'audit
 */
public record AgentChatResponse(
        String conversationId,
        String texte,
        List<AgentCard> cartes,
        List<String> outilsAppeles) {
}
