package ma.doctorek.doctorek.exception;

import ma.doctorek.doctorek.enums.StatutRdv;
import org.springframework.http.HttpStatus;
import java.util.UUID;

public class RdvNonAnnulableException extends AppException {
    public RdvNonAnnulableException(UUID rdvId, StatutRdv statut) {
        super("Le rendez-vous " + rdvId + " ne peut pas être annulé (statut : " + statut + ")", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
