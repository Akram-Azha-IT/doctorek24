package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class UserNotFoundException extends AppException {
    public UserNotFoundException(UUID id) {
        super("Utilisateur non trouvé : " + id, HttpStatus.NOT_FOUND);
    }
    public UserNotFoundException(String detail) {
        super("Utilisateur non trouvé : " + detail, HttpStatus.NOT_FOUND);
    }
}
