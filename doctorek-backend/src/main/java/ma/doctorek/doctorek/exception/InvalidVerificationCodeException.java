package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class InvalidVerificationCodeException extends AppException {
    public InvalidVerificationCodeException() {
        super("Code de vérification invalide", HttpStatus.BAD_REQUEST);
    }
}
