package ma.doctorek.doctorek.auth.domain;

public class InpeAlreadyExistsException extends RuntimeException {
    public InpeAlreadyExistsException(String inpe) {
        super("INPE already registered: " + inpe);
    }
}
