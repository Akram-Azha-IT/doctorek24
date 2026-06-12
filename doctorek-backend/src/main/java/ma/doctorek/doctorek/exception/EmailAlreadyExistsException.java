package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends AppException {
    public EmailAlreadyExistsException(String email) {
        super("Email déjà utilisé : " + email, HttpStatus.CONFLICT);
    }
}
