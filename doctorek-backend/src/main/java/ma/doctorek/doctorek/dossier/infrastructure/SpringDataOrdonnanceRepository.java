package ma.doctorek.doctorek.dossier.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface SpringDataOrdonnanceRepository extends JpaRepository<OrdonnanceEntity, UUID> {
    List<OrdonnanceEntity> findAllByPatientIdOrderByDateEmissionDesc(UUID patientId);
}
