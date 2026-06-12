package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class PhoneAlreadyExistsException extends AppException {
    public PhoneAlreadyExistsException(String phone) {
        super("Téléphone déjà utilisé : " + phone, HttpStatus.CONFLICT);
    }
}
