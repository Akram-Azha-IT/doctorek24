package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class GoogleWalletDisabledException extends AppException {
    public GoogleWalletDisabledException() {
        super("Google Wallet n'est pas configuré sur cet environnement", HttpStatus.SERVICE_UNAVAILABLE);
    }
}
