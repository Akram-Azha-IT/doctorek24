package ma.doctorek.doctorek.exception;

public class InpeAlreadyExistsException extends RuntimeException {
    public InpeAlreadyExistsException(String inpe) {
        super("INPE already registered: " + inpe);
    }
}
