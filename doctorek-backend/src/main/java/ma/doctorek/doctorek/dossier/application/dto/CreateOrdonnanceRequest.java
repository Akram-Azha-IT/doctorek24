package ma.doctorek.doctorek.dossier.application.dto;

import java.util.List;
import java.util.UUID;

public record CreateOrdonnanceRequest(
    UUID medecinId,
    List<MedicamentDto> medicaments,
    String notes
) {}
