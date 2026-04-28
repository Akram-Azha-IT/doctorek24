package ma.doctorek.doctorek.dossier.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface SpringDataDocumentRepository extends JpaRepository<DocumentMedicalEntity, UUID> {
    List<DocumentMedicalEntity> findAllByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
