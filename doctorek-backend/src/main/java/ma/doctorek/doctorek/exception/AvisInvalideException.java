package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

/**
 * Dépôt d'avis refusé : rendez-vous non terminé, déjà noté, ou n'appartenant pas au patient.
 *
 * <p>Le message reste volontairement générique côté client : détailler lequel des trois
 * cas s'applique révélerait l'existence et l'état de rendez-vous d'autrui.
 */
public class AvisInvalideException extends AppException {
    public AvisInvalideException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
