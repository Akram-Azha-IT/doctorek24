package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.RdvDocumentRequisEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RdvDocumentRequisRepository extends JpaRepository<RdvDocumentRequisEntity, UUID> {

    List<RdvDocumentRequisEntity> findByRdvIdOrderByCreatedAtAsc(UUID rdvId);

    Optional<RdvDocumentRequisEntity> findByIdAndRdvId(UUID id, UUID rdvId);
}
