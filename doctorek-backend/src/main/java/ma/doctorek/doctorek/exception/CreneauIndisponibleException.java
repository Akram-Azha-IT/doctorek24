package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class CreneauIndisponibleException extends AppException {
    public CreneauIndisponibleException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
