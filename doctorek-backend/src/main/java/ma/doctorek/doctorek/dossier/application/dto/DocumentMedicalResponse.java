package ma.doctorek.doctorek.dossier.application.dto;

import ma.doctorek.doctorek.dossier.domain.DocumentMedical;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentMedicalResponse(
    UUID id,
    UUID patientId,
    String nom,
    String typeDoc,
    Long taille,
    LocalDateTime createdAt
) {
    public static DocumentMedicalResponse from(DocumentMedical d) {
        return new DocumentMedicalResponse(d.id(), d.patientId(), d.nom(), d.typeDoc(), d.taille(), d.createdAt());
    }
}
