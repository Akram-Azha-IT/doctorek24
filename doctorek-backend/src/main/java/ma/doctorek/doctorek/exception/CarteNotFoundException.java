package ma.doctorek.doctorek.exception;

import java.util.UUID;

public class CarteNotFoundException extends RuntimeException {
    public CarteNotFoundException(UUID patientId) {
        super("Carte virtuelle not found for patient: " + patientId);
    }

    public CarteNotFoundException(String message) {
        super(message);
    }
}
