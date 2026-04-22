package ma.doctorek.doctorek.agenda.domain;

import java.util.UUID;

public class RdvNonConfirmableException extends RuntimeException {
    public RdvNonConfirmableException(UUID rdvId, StatutRdv statut) {
        super("Le rendez-vous " + rdvId + " ne peut pas être confirmé (statut : " + statut + ")");
    }
}
