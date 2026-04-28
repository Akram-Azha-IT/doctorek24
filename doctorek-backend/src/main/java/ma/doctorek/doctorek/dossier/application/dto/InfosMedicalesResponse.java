package ma.doctorek.doctorek.dossier.application.dto;

import ma.doctorek.doctorek.dossier.domain.InfosMedicales;

import java.util.List;
import java.util.UUID;

public record InfosMedicalesResponse(
    UUID patientId,
    String groupeSanguin,
    List<String> allergies,
    String antecedents,
    String traitementsCours,
    String notesGenerales
) {
    public static InfosMedicalesResponse from(InfosMedicales infos) {
        return new InfosMedicalesResponse(
            infos.patientId(),
            infos.groupeSanguin(),
            infos.allergies(),
            infos.antecedents(),
            infos.traitementsCours(),
            infos.notesGenerales()
        );
    }

    public static InfosMedicalesResponse empty(UUID patientId) {
        return new InfosMedicalesResponse(patientId, null, List.of(), null, null, null);
    }
}
