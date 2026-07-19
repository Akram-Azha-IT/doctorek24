package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.GestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GestionRepository extends JpaRepository<GestionEntity, UUID> {

    boolean existsByGestionnaireCompteIdAndPatientIdAndActifTrue(UUID gestionnaireId, UUID patientId);

    Optional<GestionEntity> findByGestionnaireCompteIdAndPatientId(UUID gestionnaireId, UUID patientId);

    Optional<GestionEntity> findByGestionnaireCompteIdAndPatientIdAndActifTrue(UUID gestionnaireId, UUID patientId);

    List<GestionEntity> findByGestionnaireCompteIdAndActifTrue(UUID gestionnaireId);

    List<GestionEntity> findByPatientIdAndActifTrue(UUID patientId);
}
