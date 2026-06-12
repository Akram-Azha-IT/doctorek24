package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.PatientDetailEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientDetailRepository extends JpaRepository<PatientDetailEntity, UUID> {

    Optional<PatientDetailEntity> findByUserId(UUID userId);

    @Query(value = """
        SELECT * FROM patient.patient_details
        WHERE date_naissance IS NOT NULL
          AND EXTRACT(MONTH FROM date_naissance) = :month
          AND EXTRACT(DAY   FROM date_naissance) = :day
        """, nativeQuery = true)
    List<PatientDetailEntity> findByBirthMonthAndDay(@Param("month") int month, @Param("day") int day);
}
