package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.ConsentementEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsentementRepository extends JpaRepository<ConsentementEntity, UUID> {

    boolean existsByUserIdAndVersion(UUID userId, String version);

    /** Historique d'un compte, du plus récent au plus ancien. */
    List<ConsentementEntity> findByUserIdOrderByAccepteAtDesc(UUID userId);
}
