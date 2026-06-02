package ma.doctorek.doctorek.exception;

import java.util.UUID;

public class DisponibiliteNotFoundException extends RuntimeException {
    public DisponibiliteNotFoundException(UUID id) {
        super("Disponibilité not found: " + id);
    }
}
