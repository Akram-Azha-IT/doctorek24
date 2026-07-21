package ma.doctorek.doctorek.messaging.dto;

import ma.doctorek.doctorek.entity.MessageEntity;
import ma.doctorek.doctorek.enums.MessageType;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID conversationId,
        UUID senderId,
        MessageType messageType,
        String content,
        // AUDIO uniquement : URL protégée à récupérer avec le token (jamais publique)
        // + durée en secondes. null pour TEXT.
        String mediaUrl,
        Integer mediaDurationSec,
        Instant sentAt,
        Instant readAt,
        String clientMsgId
) {
    public static MessageResponse from(MessageEntity m) {
        String mediaUrl = m.getMessageType() == MessageType.AUDIO
                ? "/api/v1/messaging/messages/" + m.getId() + "/audio"
                : null;
        return new MessageResponse(
                m.getId(), m.getConversationId(), m.getSenderId(),
                m.getMessageType(), m.getContent(),
                mediaUrl, m.getMediaDurationSec(),
                m.getSentAt(), m.getReadAt(), m.getClientMsgId());
    }
}
