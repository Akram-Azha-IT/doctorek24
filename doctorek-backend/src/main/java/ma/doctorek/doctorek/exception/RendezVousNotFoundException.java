package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class RendezVousNotFoundException extends AppException {
    public RendezVousNotFoundException(UUID id) {
        super("Rendez-vous non trouvé : " + id, HttpStatus.NOT_FOUND);
    }
}
