package ma.doctorek.doctorek.agenda.application.dto;

import java.util.List;

public record PatientsPageResponse(
    List<PatientSummaryResponse> patients,
    long total,
    int page,
    int size
) {}
