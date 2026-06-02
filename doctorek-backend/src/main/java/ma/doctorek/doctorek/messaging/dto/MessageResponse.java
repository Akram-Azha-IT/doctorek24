package ma.doctorek.doctorek.messaging.dto;

import ma.doctorek.doctorek.entity.MessageEntity;
import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String content,
        Instant sentAt,
        Instant readAt,
        String clientMsgId
) {
    public static MessageResponse from(MessageEntity m) {
        return new MessageResponse(m.getId(), m.getConversationId(), m.getSenderId(),
                m.getContent(), m.getSentAt(), m.getReadAt(), m.getClientMsgId());
    }
}
