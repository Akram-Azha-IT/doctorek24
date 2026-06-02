package ma.doctorek.doctorek.exception;

import java.util.UUID;

public class RendezVousNotFoundException extends RuntimeException {
    public RendezVousNotFoundException(UUID id) {
        super("Rendez-vous not found: " + id);
    }
}
