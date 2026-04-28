package ma.doctorek.doctorek.dossier.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface SpringDataInfosMedicalesRepository extends JpaRepository<InfosMedicalesEntity, UUID> {}
