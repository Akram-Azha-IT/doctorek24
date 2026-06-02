package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMedecinPhotoRequest(@NotBlank String photoUrl) {}
