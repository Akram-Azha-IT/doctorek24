package ma.doctorek.doctorek.admin.application.dto;

import java.util.List;

public record UsersPageResponse(
        List<UserSummaryResponse> users,
        long total,
        int page,
        int size
) {}
