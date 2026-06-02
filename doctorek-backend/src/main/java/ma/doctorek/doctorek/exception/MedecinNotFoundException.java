package ma.doctorek.doctorek.exception;

import java.util.UUID;

public class MedecinNotFoundException extends RuntimeException {
    public MedecinNotFoundException(UUID id) {
        super("Médecin not found: " + id);
    }
}
