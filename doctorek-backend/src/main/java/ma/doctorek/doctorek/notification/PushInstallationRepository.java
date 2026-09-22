package ma.doctorek.doctorek.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushInstallationRepository extends JpaRepository<PushInstallationEntity, UUID> {
    Optional<PushInstallationEntity> findByInstallationId(UUID installationId);
    Optional<PushInstallationEntity> findByTokenHash(String tokenHash);
    List<PushInstallationEntity> findByUserIdAndEnabledTrue(UUID userId);
}
