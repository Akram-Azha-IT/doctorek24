package ma.doctorek.doctorek.dto;

import java.util.List;

/**
 * Ordonnances et documents du patient, servis après OTP validé (consentement).
 * Permet à un médecin qui scanne le QR de voir le dossier même sans RDV préalable.
 */
public record CarteDossierResponse(
        List<OrdonnanceResponse> ordonnances,
        List<DocumentMedicalResponse> documents) {}
