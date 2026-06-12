package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class CarteNotFoundException extends AppException {
    public CarteNotFoundException(UUID patientId) {
        super("Carte virtuelle non trouvée pour le patient : " + patientId, HttpStatus.NOT_FOUND);
    }
    public CarteNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
