package ma.doctorek.doctorek.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String body,
        String data,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(NotificationEntity e) {
        return new NotificationResponse(
                e.getId(), e.getType(), e.getTitle(), e.getBody(),
                e.getData(), e.getReadAt() != null, e.getCreatedAt());
    }
}
