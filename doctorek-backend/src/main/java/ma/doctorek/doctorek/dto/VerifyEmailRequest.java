package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

public record VerifyEmailRequest(
        @NotNull UUID userId,
        @NotNull @Pattern(regexp = "^[0-9]{6}$") String code) {}
