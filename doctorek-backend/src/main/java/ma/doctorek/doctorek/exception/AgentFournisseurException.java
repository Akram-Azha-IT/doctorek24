package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

/** Erreur temporaire du fournisseur du modèle : clé, quota ou service distant. */
public class AgentFournisseurException extends AppException {

    public AgentFournisseurException(Throwable cause) {
        super("L'assistant est momentanément indisponible. Réessayez dans quelques instants.",
                HttpStatus.SERVICE_UNAVAILABLE);
        initCause(cause);
    }
}
