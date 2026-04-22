package ma.doctorek.doctorek.auth.domain;

public class VerificationCodeExpiredException extends RuntimeException {
    public VerificationCodeExpiredException() {
        super("Le code de vérification a expiré. Veuillez vous réinscrire.");
    }
}
