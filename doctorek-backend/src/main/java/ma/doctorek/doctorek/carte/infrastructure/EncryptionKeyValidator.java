package ma.doctorek.doctorek.carte.infrastructure;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EncryptionKeyValidator {

    private final String encryptionKey;

    public EncryptionKeyValidator(@Value("${doctorek.carte.encryption-key}") String encryptionKey) {
        this.encryptionKey = encryptionKey;
    }

    @PostConstruct
    public void validate() {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            throw new IllegalStateException(
                "VMC_ENCRYPTION_KEY environment variable is not set. " +
                "Application cannot start without a valid encryption key.");
        }
    }
}
