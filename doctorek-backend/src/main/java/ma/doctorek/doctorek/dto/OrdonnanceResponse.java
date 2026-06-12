package ma.doctorek.doctorek.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record OrdonnanceResponse(
        UUID id,
        UUID patientId,
        UUID medecinId,
        String medecinNom,
        String source,
        LocalDate dateEmission,
        List<MedicamentDto> medicaments,
        String notes,
        String fichierNom) {}
