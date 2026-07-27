package ma.doctorek.doctorek.messaging.dto;

import ma.doctorek.doctorek.entity.ConversationEntity;
import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UUID medecinId,
        UUID patientId,
        String medecinName,
        String patientName,
        String medecinPhotoUrl,
        String patientPhotoUrl,
        Instant lastMessageAt,
        Instant createdAt,
        long unreadCount,
        boolean patientCanReply,
        MessageResponse lastMessage
) {
    public static ConversationResponse from(ConversationEntity c, String medecinName, String patientName,
                                             String medecinPhotoUrl, String patientPhotoUrl,
                                             long unreadCount, MessageResponse lastMessage) {
        return new ConversationResponse(c.getId(), c.getMedecinId(), c.getPatientId(),
                medecinName, patientName, medecinPhotoUrl, patientPhotoUrl,
                c.getLastMessageAt(), c.getCreatedAt(),
                unreadCount, c.isPatientCanReply(), lastMessage);
    }
}
