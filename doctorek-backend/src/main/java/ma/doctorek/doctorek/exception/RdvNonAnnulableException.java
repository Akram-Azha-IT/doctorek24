package ma.doctorek.doctorek.exception;

import ma.doctorek.doctorek.enums.StatutRdv;

import java.util.UUID;

public class RdvNonAnnulableException extends RuntimeException {
    public RdvNonAnnulableException(UUID rdvId, StatutRdv statut) {
        super("Le rendez-vous " + rdvId + " ne peut pas être annulé (statut : " + statut + ")");
    }
}
