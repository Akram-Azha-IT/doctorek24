package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.RattachementTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RattachementTokenRepository extends JpaRepository<RattachementTokenEntity, UUID> {

    List<RattachementTokenEntity> findByPatientIdAndUsedAtIsNull(UUID patientId);
}
