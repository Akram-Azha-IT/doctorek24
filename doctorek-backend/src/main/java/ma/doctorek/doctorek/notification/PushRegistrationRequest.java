package ma.doctorek.doctorek.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record PushRegistrationRequest(
        @NotNull UUID installationId,
        @NotBlank @Pattern(regexp = "ANDROID|IOS") String platform,
        @NotBlank @Pattern(regexp = "DEVELOPMENT|PRODUCTION") String environment,
        @NotBlank @Size(max = 4096) String token) {}
