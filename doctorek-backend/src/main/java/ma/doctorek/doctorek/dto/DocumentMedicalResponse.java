package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.DocumentMedicalEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentMedicalResponse(
        UUID id,
        UUID patientId,
        String nom,
        String typeDoc,
        Long taille,
        LocalDateTime createdAt) {

    public static DocumentMedicalResponse from(DocumentMedicalEntity d) {
        return new DocumentMedicalResponse(
                d.getId(),
                d.getPatientId(),
                d.getNom(),
                d.getTypeDoc(),
                d.getTaille(),
                d.getCreatedAt());
    }
}
