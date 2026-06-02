package ma.doctorek.doctorek.messaging.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record StartConversationRequest(@NotNull UUID otherUserId) {}
