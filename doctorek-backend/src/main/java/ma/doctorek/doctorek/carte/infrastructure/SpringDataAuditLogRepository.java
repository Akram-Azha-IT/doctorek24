package ma.doctorek.doctorek.carte.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SpringDataAuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {
}
