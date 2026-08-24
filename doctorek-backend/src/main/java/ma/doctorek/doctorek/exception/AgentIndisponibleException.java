package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

/**
 * Levée quand l'assistant est appelé alors qu'aucun modèle n'est configuré
 * (propriété {@code spring.ai.model.chat} non positionnée, ou clé API absente).
 *
 * <p>Le module agent est optionnel : l'application démarre et fonctionne sans lui.
 * Mappée en HTTP 503 pour que le frontend puisse masquer l'entrée de l'assistant.
 */
public class AgentIndisponibleException extends AppException {
    public AgentIndisponibleException() {
        super("L'assistant n'est pas disponible pour le moment.", HttpStatus.SERVICE_UNAVAILABLE);
    }
}
