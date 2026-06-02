package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.DocumentMedicalEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentMedicalRepository extends JpaRepository<DocumentMedicalEntity, UUID> {
    List<DocumentMedicalEntity> findAllByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
