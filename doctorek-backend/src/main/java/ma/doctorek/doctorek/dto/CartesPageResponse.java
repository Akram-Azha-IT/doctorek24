package ma.doctorek.doctorek.dto;

import java.util.List;

public record CartesPageResponse(
        List<CarteSummaryResponse> content,
        long total,
        int page,
        int size) {}
