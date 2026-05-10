package ma.doctorek.doctorek.admin.application.dto;

import java.util.List;

public record CartesPageResponse(
        List<CarteSummaryResponse> cartes,
        long total,
        int page,
        int size
) {}
