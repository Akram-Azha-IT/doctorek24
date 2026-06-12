package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class InpeAlreadyExistsException extends AppException {
    public InpeAlreadyExistsException(String inpe) {
        super("INPE déjà enregistré : " + inpe, HttpStatus.CONFLICT);
    }
}
