package ma.doctorek.doctorek.annuaire.application.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMedecinPhotoRequest(@NotBlank String photoUrl) {}
