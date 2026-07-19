package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class PatientNotFoundException extends AppException {
    public PatientNotFoundException(UUID id) {
        super("Patient non trouvé : " + id, HttpStatus.NOT_FOUND);
    }
}
