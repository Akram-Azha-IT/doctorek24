package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

/**
 * Levée quand le modèle enchaîne plus d'appels d'outils que le plafond autorisé
 * pour un même tour de conversation.
 *
 * <p>Garde-fou contre une boucle du modèle : sans plafond, un enchaînement
 * outil → résultat → outil peut se répéter indéfiniment et consommer le quota
 * gratuit en quelques requêtes. L'exception interrompt la boucle interne de
 * Spring AI et remonte jusqu'au contrôleur.
 */
public class AgentLimiteOutilsException extends AppException {
    public AgentLimiteOutilsException(int plafond) {
        super("La recherche a demandé trop d'étapes (plafond : " + plafond
                + "). Reformulez votre demande de façon plus précise.", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
