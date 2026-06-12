package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends AppException {
    public InvalidCredentialsException() {
        super("Identifiants incorrects", HttpStatus.UNAUTHORIZED);
    }
}
