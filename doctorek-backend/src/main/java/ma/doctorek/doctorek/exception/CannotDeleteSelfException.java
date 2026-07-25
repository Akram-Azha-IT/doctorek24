package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class CannotDeleteSelfException extends AppException {
    public CannotDeleteSelfException() {
        super("Vous ne pouvez pas supprimer votre propre compte.", HttpStatus.BAD_REQUEST);
    }
}
