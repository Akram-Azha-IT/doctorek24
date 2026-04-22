package ma.doctorek.doctorek.agenda.domain;

import java.util.UUID;

public class RdvNonTerminableException extends RuntimeException {
    public RdvNonTerminableException(UUID rdvId, StatutRdv statut) {
        super("Le rendez-vous " + rdvId + " ne peut pas être terminé (statut : " + statut + ")");
    }
}
