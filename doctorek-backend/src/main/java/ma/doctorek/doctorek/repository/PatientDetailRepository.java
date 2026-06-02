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

    @Query("SELECT p FROM PatientDetailEntity p WHERE p.dateNaissance IS NOT NULL AND FUNCTION('MONTH', p.dateNaissance) = :month AND FUNCTION('DAY', p.dateNaissance) = :day")
    List<PatientDetailEntity> findByBirthMonthAndDay(@Param("month") int month, @Param("day") int day);
}
