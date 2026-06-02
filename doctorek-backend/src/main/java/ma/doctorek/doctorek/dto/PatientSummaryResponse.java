package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.enums.StatutRdv;

import java.time.LocalDate;
import java.util.UUID;

public record PatientSummaryResponse(
        UUID patientId,
        String firstName,
        String lastName,
        LocalDate dernierRdvDate,
        StatutRdv dernierRdvStatut,
        boolean hasFutureRdv) {}
