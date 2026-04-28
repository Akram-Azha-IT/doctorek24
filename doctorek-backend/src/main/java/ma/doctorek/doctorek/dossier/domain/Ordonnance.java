package ma.doctorek.doctorek.dossier.domain;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record Ordonnance(
    UUID id,
    UUID patientId,
    UUID medecinId,
    LocalDate dateEmission,
    List<Medicament> medicaments,
    String notes
) {}
