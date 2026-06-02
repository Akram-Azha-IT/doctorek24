package ma.doctorek.doctorek.exception;

import ma.doctorek.doctorek.enums.StatutRdv;

import java.util.UUID;

public class RdvNonConfirmableException extends RuntimeException {
    public RdvNonConfirmableException(UUID rdvId, StatutRdv statut) {
        super("Le rendez-vous " + rdvId + " ne peut pas être confirmé (statut : " + statut + ")");
    }
}
