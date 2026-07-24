package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpVerifyRequest(
        @NotBlank @Pattern(regexp = "\\d{6}", message = "Le code doit comporter 6 chiffres")
        String code) {}
