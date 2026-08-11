package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class AvisNotFoundException extends AppException {
    public AvisNotFoundException(UUID id) {
        super("Avis introuvable : " + id, HttpStatus.NOT_FOUND);
    }
}
