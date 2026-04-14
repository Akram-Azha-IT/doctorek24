package ma.doctorek.doctorek.agenda.domain;

import java.util.UUID;

public class RendezVousNotFoundException extends RuntimeException {
    public RendezVousNotFoundException(UUID id) {
        super("Rendez-vous introuvable : " + id);
    }
}