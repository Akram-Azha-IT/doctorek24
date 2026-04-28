package ma.doctorek.doctorek.dossier.domain;

import java.util.List;
import java.util.UUID;

public record InfosMedicales(
    UUID patientId,
    String groupeSanguin,
    List<String> allergies,
    String antecedents,
    String traitementsCours,
    String notesGenerales
) {}
