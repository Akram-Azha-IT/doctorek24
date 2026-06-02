package ma.doctorek.doctorek.dto;

public record UserSummaryResponse(
        String id,
        String email,
        String firstName,
        String lastName,
        String role,
        String specialite,
        String ville,
        boolean active,
        boolean emailVerified,
        String createdAt,
        boolean hasCarteVirtuelle) {}
