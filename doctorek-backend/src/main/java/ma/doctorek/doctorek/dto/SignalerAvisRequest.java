package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.Size;

/** Signalement d'un avis. Le motif est libre et facultatif — il éclaire la modération. */
public record SignalerAvisRequest(
        @Size(max = 500, message = "Le motif ne peut pas dépasser 500 caractères")
        String motif) {}
