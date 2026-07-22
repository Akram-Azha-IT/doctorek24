package ma.doctorek.doctorek.exception;

/** Levée quand un utilisateur dépasse un quota de fréquence (anti-flood). Mappée en HTTP 429. */
public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
