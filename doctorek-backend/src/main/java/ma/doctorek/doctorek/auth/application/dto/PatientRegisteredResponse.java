package ma.doctorek.doctorek.auth.application.dto;

import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.domain.User;

import java.time.Instant;
import java.util.UUID;

public record PatientRegisteredResponse(
    UUID    id,
    String  email,
    String  phone,
    String  firstName,
    String  lastName,
    Role    role,
    String  lang,
    Instant createdAt
) {
    public static PatientRegisteredResponse from(User user) {
        return new PatientRegisteredResponse(
            user.getId(),
            user.getEmail(),
            user.getPhone(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole(),
            user.getLang(),
            user.getCreatedAt()
        );
    }
}
