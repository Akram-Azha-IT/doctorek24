package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.CarteVirtuelleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CarteVirtuelleRepository extends JpaRepository<CarteVirtuelleEntity, UUID> {
    Optional<CarteVirtuelleEntity> findByPatientId(UUID patientId);
    Optional<CarteVirtuelleEntity> findByCardRef(String cardRef);
    boolean existsByPatientId(UUID patientId);
}
