package ma.doctorek.doctorek.auth.application.dto;

import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.domain.User;

import java.time.Instant;
import java.util.UUID;

public record MedecinRegisteredResponse(
    UUID    id,
    String  email,
    String  phone,
    String  firstName,
    String  lastName,
    String  inpe,
    String  specialite,
    String  ville,
    Role    role,
    String  lang,
    Instant createdAt
) {
    public static MedecinRegisteredResponse from(User user) {
        return new MedecinRegisteredResponse(
            user.getId(),
            user.getEmail(),
            user.getPhone(),
            user.getFirstName(),
            user.getLastName(),
            user.getInpe(),
            user.getSpecialite(),
            user.getVille(),
            user.getRole(),
            user.getLang(),
            user.getCreatedAt()
        );
    }
}
