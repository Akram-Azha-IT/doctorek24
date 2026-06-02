package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.OrdonnanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrdonnanceRepository extends JpaRepository<OrdonnanceEntity, UUID> {
    List<OrdonnanceEntity> findAllByPatientIdOrderByDateEmissionDesc(UUID patientId);
}
