package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class ProcheNotFoundException extends AppException {
    public ProcheNotFoundException(UUID procheId) {
        super("Proche non trouvé ou non géré par ce compte : " + procheId, HttpStatus.NOT_FOUND);
    }
}
