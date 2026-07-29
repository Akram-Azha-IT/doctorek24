package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

/** Inscription en liste d'attente refusée : plage incohérente ou inscription introuvable. */
public class ListeAttenteInvalideException extends AppException {
    public ListeAttenteInvalideException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
