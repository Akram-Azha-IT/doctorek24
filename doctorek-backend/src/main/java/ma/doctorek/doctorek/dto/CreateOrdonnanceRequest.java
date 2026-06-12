package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotEmpty;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateOrdonnanceRequest(
        UUID medecinId,          // null for patient-added ordonnances
        String medecinNom,       // free text when medecinId is null
        String source,           // "MEDECIN" | "PATIENT" (defaults to MEDECIN if null)
        LocalDate dateEmission,
        @NotEmpty List<MedicamentDto> medicaments,
        String notes) {}
