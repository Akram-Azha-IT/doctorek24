package ma.doctorek.doctorek.dto;

import java.util.List;

public record UsersPageResponse(
        List<UserSummaryResponse> content,
        long total,
        int page,
        int size) {}
