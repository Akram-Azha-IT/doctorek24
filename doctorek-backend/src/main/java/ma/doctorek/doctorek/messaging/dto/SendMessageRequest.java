package ma.doctorek.doctorek.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record SendMessageRequest(
        @NotNull UUID conversationId,
        @NotBlank @Size(max = 5000, message = "Message trop long (max 5000 caractères)") String content,
        String clientMsgId
) {}
