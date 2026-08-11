package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.AvisSignalementEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AvisSignalementRepository
        extends JpaRepository<AvisSignalementEntity, AvisSignalementEntity.Cle> {

    boolean existsByAvisIdAndAuteurId(UUID avisId, UUID auteurId);

    long countByAvisId(UUID avisId);
}
