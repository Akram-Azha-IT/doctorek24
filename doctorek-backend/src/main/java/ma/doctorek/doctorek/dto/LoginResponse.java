package ma.doctorek.doctorek.dto;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    String userId,
    String role,
    String firstName,
    String lastName,
    String email
) {}
