package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class DisponibiliteNotFoundException extends AppException {
    public DisponibiliteNotFoundException(UUID id) {
        super("Disponibilité non trouvée : " + id, HttpStatus.NOT_FOUND);
    }
}
