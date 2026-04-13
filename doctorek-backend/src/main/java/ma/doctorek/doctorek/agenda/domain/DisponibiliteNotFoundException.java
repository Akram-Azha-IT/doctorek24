package ma.doctorek.doctorek.agenda.domain;

import java.util.UUID;

public class DisponibiliteNotFoundException extends RuntimeException {
    public DisponibiliteNotFoundException(UUID medecinId) {
        super("Aucune disponibilité trouvée pour le médecin : " + medecinId);
    }
}