package ma.doctorek.doctorek.agenda.application.dto;

import ma.doctorek.doctorek.agenda.domain.PatientSummary;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;

import java.time.LocalDate;
import java.util.UUID;

public record PatientSummaryResponse(
    UUID patientId,
    String firstName,
    String lastName,
    LocalDate dernierRdvDate,
    StatutRdv dernierRdvStatut,
    boolean hasFutureRdv
) {
    public static PatientSummaryResponse from(PatientSummary p) {
        return new PatientSummaryResponse(
            p.patientId(), p.firstName(), p.lastName(),
            p.dernierRdvDate(), p.dernierRdvStatut(), p.hasFutureRdv()
        );
    }
}
