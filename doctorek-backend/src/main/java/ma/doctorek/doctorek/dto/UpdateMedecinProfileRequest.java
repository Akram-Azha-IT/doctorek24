package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMedecinProfileRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        String phone,
        @NotBlank String specialite,
        @NotBlank String ville,
        String adresse,
        String lang,
        Double latitude,
        Double longitude) {}
