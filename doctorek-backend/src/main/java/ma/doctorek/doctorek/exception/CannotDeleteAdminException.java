package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class CannotDeleteAdminException extends AppException {
    public CannotDeleteAdminException() {
        super("Un compte administrateur ne peut pas être supprimé.", HttpStatus.FORBIDDEN);
    }
}
