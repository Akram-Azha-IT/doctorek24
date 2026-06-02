package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.ConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<ConversationEntity, UUID> {

    Optional<ConversationEntity> findByMedecinIdAndPatientId(UUID medecinId, UUID patientId);

    @Query("SELECT c FROM ConversationEntity c WHERE c.medecinId = :userId OR c.patientId = :userId ORDER BY c.lastMessageAt DESC NULLS LAST")
    List<ConversationEntity> findByParticipant(@Param("userId") UUID userId);
}
