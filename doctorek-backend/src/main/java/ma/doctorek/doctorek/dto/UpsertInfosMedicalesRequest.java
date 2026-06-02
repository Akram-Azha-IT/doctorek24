package ma.doctorek.doctorek.dto;

import java.util.List;

public record UpsertInfosMedicalesRequest(
        String groupeSanguin,
        List<String> allergies,
        String antecedents,
        String traitementsCours,
        String notesGenerales) {}
