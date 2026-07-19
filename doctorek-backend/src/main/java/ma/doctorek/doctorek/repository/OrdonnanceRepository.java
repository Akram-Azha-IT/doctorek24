package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.OrdonnanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrdonnanceRepository extends JpaRepository<OrdonnanceEntity, UUID> {
    List<OrdonnanceEntity> findAllByPatientIdOrderByDateEmissionDesc(UUID patientId);

    /** Fusion compte famille : réaffecte les ordonnances d'un patient orphelin. */
    @Modifying
    @Query("UPDATE OrdonnanceEntity o SET o.patientId = :to WHERE o.patientId = :from")
    int reassignPatient(@Param("from") UUID from, @Param("to") UUID to);
}
