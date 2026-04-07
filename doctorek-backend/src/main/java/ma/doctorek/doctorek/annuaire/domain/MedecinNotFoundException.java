package ma.doctorek.doctorek.annuaire.domain;

import java.util.UUID;

public class MedecinNotFoundException extends RuntimeException {
    public MedecinNotFoundException(UUID id) {
        super("Médecin non trouvé : id=" + id);
    }
}
