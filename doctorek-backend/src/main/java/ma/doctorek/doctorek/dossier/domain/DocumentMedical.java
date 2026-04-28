package ma.doctorek.doctorek.dossier.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentMedical(
    UUID id,
    UUID patientId,
    String nom,
    String typeDoc,
    String chemin,
    Long taille,
    LocalDateTime createdAt
) {}
