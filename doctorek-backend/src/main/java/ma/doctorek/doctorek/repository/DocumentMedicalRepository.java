package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.DocumentMedicalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DocumentMedicalRepository extends JpaRepository<DocumentMedicalEntity, UUID> {
    List<DocumentMedicalEntity> findAllByPatientIdOrderByCreatedAtDesc(UUID patientId);

    /** Fusion compte famille : réaffecte les documents d'un patient orphelin. */
    @Modifying
    @Query("UPDATE DocumentMedicalEntity d SET d.patientId = :to WHERE d.patientId = :from")
    int reassignPatient(@Param("from") UUID from, @Param("to") UUID to);
}
