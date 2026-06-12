package ma.doctorek.doctorek.exception;

import ma.doctorek.doctorek.enums.StatutRdv;
import org.springframework.http.HttpStatus;
import java.util.UUID;

public class RdvNonConfirmableException extends AppException {
    public RdvNonConfirmableException(UUID rdvId, StatutRdv statut) {
        super("Le rendez-vous " + rdvId + " ne peut pas être confirmé (statut : " + statut + ")", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
