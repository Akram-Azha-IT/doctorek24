package ma.doctorek.doctorek.auth.domain;

public class InvalidVerificationCodeException extends RuntimeException {
    public InvalidVerificationCodeException() {
        super("Code de vérification incorrect");
    }
}
