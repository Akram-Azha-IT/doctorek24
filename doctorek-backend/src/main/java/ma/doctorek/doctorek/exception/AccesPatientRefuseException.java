package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class AccesPatientRefuseException extends AppException {
    public AccesPatientRefuseException(UUID patientId) {
        super("Vous n'êtes pas autorisé à agir pour ce patient : " + patientId, HttpStatus.FORBIDDEN);
    }
}
