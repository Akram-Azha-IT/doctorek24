package ma.doctorek.doctorek.notification;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
public class PushInstallationService {
    private final PushInstallationRepository repository;
    private final PushTokenCipher cipher;

    public PushInstallationService(PushInstallationRepository repository, PushTokenCipher cipher) {
        this.repository = repository; this.cipher = cipher;
    }

    @Transactional
    public void register(UUID userId, PushRegistrationRequest request) {
        String hash = cipher.hash(request.token());
        PushInstallationEntity installation = repository.findByInstallationId(request.installationId())
                .orElseGet(() -> repository.findByTokenHash(hash).orElseGet(PushInstallationEntity::new));
        repository.findByTokenHash(hash)
                .filter(existing -> installation.getId() != null && !existing.getId().equals(installation.getId()))
                .ifPresent(repository::delete);
        installation.setUserId(userId);
        installation.setInstallationId(request.installationId());
        installation.setPlatform(request.platform());
        installation.setEnvironment(request.environment());
        installation.setTokenHash(hash);
        installation.setTokenCiphertext(cipher.encrypt(request.token()));
        installation.setEnabled(true);
        installation.setLastSeenAt(Instant.now());
        repository.save(installation);
    }

    @Transactional
    public void unregister(UUID userId, UUID installationId) {
        repository.findByInstallationId(installationId)
                .filter(value -> value.getUserId().equals(userId))
                .ifPresent(value -> { value.setEnabled(false); repository.save(value); });
    }
}
