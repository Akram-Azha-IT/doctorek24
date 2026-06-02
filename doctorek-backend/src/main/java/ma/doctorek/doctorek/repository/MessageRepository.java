package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.MessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {

    Optional<MessageEntity> findByClientMsgId(String clientMsgId);

    Page<MessageEntity> findByConversationIdOrderBySentAtDesc(UUID conversationId, Pageable pageable);

    @Modifying
    @Query("UPDATE MessageEntity m SET m.readAt = :now WHERE m.conversationId = :convId AND m.senderId <> :readerId AND m.readAt IS NULL")
    int markConversationRead(@Param("convId") UUID convId, @Param("readerId") UUID readerId, @Param("now") Instant now);

    @Query("SELECT COUNT(m) FROM MessageEntity m WHERE m.conversationId = :convId AND m.senderId <> :userId AND m.readAt IS NULL")
    long countUnread(@Param("convId") UUID convId, @Param("userId") UUID userId);
}
