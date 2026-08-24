package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentMessage;

import java.util.List;

/**
 * Frontière avec le fournisseur de modèle.
 *
 * <p>Une seule méthode, aucun type Spring AI dans la signature. Deux bénéfices
 * concrets :
 * <ul>
 *   <li>{@link AgentService} se teste avec une implémentation factice — la chaîne
 *       d'intégration ne fait jamais d'appel réseau ;</li>
 *   <li>changer de fournisseur (ou en ajouter un de repli quand le quota gratuit
 *       est épuisé) ne touche qu'une classe.</li>
 * </ul>
 *
 * <p>L'exécution des outils reste interne à l'implémentation : elle alimente
 * {@link AgentTurnContext}, que l'appelant relit ensuite pour construire les cartes.
 */
public interface AgentModelClient {

    /**
     * @param historique tours précédents, du plus ancien au plus récent
     * @param question   message du patient
     * @return le texte de la réponse, une à deux phrases
     */
    String repondre(List<AgentMessage> historique, String question);
}
