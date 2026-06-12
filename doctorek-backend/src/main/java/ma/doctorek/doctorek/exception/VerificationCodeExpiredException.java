package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class VerificationCodeExpiredException extends AppException {
    public VerificationCodeExpiredException() {
        super("Code de vérification expiré", HttpStatus.GONE);
    }
}
