package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.InfosMedicalesEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InfosMedicalesRepository extends JpaRepository<InfosMedicalesEntity, UUID> {}
