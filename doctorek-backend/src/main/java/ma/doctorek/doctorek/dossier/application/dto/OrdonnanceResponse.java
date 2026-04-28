package ma.doctorek.doctorek.dossier.application.dto;

import ma.doctorek.doctorek.dossier.domain.Ordonnance;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record OrdonnanceResponse(
    UUID id,
    UUID patientId,
    UUID medecinId,
    LocalDate dateEmission,
    List<MedicamentDto> medicaments,
    String notes
) {
    public static OrdonnanceResponse from(Ordonnance o) {
        var meds = o.medicaments() == null ? List.<MedicamentDto>of() :
            o.medicaments().stream()
                .map(m -> new MedicamentDto(m.nom(), m.dosage(), m.frequence(), m.duree()))
                .toList();
        return new OrdonnanceResponse(o.id(), o.patientId(), o.medecinId(), o.dateEmission(), meds, o.notes());
    }
}
