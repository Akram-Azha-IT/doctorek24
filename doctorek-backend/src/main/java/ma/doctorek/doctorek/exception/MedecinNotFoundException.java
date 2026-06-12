package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class MedecinNotFoundException extends AppException {
    public MedecinNotFoundException(UUID id) {
        super("Médecin non trouvé : " + id, HttpStatus.NOT_FOUND);
    }
}
