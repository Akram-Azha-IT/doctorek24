package ma.doctorek.doctorek.auth.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record VerifyEmailRequest(
    @NotNull(message = "L'identifiant utilisateur est requis")
    UUID userId,

    @NotBlank(message = "Le code de vérification est requis")
    @Pattern(regexp = "\\d{6}", message = "Le code doit être composé de 6 chiffres")
    String code
) {}
