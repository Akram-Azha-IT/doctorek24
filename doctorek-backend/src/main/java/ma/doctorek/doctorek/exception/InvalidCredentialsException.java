package ma.doctorek.doctorek.exception;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Identifiants incorrects");
    }
}
