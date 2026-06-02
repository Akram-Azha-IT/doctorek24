package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.InfosMedicalesEntity;

import java.util.List;
import java.util.UUID;

public record InfosMedicalesResponse(
        UUID patientId,
        String groupeSanguin,
        List<String> allergies,
        String antecedents,
        String traitementsCours,
        String notesGenerales) {

    public static InfosMedicalesResponse from(InfosMedicalesEntity e) {
        return new InfosMedicalesResponse(
                e.getPatientId(),
                e.getGroupeSanguin(),
                e.getAllergies(),
                e.getAntecedents(),
                e.getTraitementsCours(),
                e.getNotesGenerales());
    }

    public static InfosMedicalesResponse empty(UUID patientId) {
        return new InfosMedicalesResponse(patientId, null, List.of(), null, null, null);
    }
}
