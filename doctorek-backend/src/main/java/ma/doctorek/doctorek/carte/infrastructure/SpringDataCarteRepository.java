package ma.doctorek.doctorek.carte.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SpringDataCarteRepository extends JpaRepository<CarteVirtuelleEntity, UUID> {
    Optional<CarteVirtuelleEntity> findByPatientId(UUID patientId);
    Optional<CarteVirtuelleEntity> findByCardRef(String cardRef);
    boolean existsByPatientId(UUID patientId);
}
