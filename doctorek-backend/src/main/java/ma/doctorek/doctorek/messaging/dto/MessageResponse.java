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
        // AUDIO/DOCUMENT : URL protégée à récupérer avec le token (jamais publique). null pour TEXT.
        String mediaUrl,
        Integer mediaDurationSec,   // AUDIO
        String mediaFilename,       // DOCUMENT
        Long mediaSize,             // DOCUMENT (octets)
        Instant sentAt,
        Instant readAt,
        String clientMsgId
) {
    public static MessageResponse from(MessageEntity m) {
        boolean hasMedia = m.getMessageType() == MessageType.AUDIO
                || m.getMessageType() == MessageType.DOCUMENT;
        String mediaUrl = hasMedia ? "/api/v1/messaging/messages/" + m.getId() + "/media" : null;
        return new MessageResponse(
                m.getId(), m.getConversationId(), m.getSenderId(),
                m.getMessageType(), m.getContent(),
                mediaUrl, m.getMediaDurationSec(), m.getMediaFilename(), m.getMediaSize(),
                m.getSentAt(), m.getReadAt(), m.getClientMsgId());
    }
}
