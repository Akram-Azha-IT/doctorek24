package ma.doctorek.doctorek.dto;

import java.util.List;

public record PatientsPageResponse(
        List<PatientSummaryResponse> content,
        long total,
        int page,
        int size) {}
