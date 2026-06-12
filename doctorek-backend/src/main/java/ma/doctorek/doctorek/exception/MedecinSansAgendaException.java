package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;
import java.util.UUID;

public class MedecinSansAgendaException extends AppException {
    public MedecinSansAgendaException(UUID medecinId) {
        super("Le médecin n'a pas défini d'agenda : " + medecinId, HttpStatus.NOT_FOUND);
    }
}
