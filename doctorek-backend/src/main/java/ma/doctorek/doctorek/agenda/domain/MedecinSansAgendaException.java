package ma.doctorek.doctorek.agenda.domain;

import java.util.UUID;

public class MedecinSansAgendaException extends RuntimeException {
    public MedecinSansAgendaException(UUID medecinId) {
        super("Le médecin n'a pas défini d'agenda : " + medecinId);
    }
}