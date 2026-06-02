package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;

import java.time.Instant;
import java.util.UUID;

public record MedecinRegisteredResponse(
        UUID id,
        String email,
        String phone,
        String firstName,
        String lastName,
        String inpe,
        String specialite,
        String ville,
        Role role,
        String lang,
        Instant createdAt) {

    public static MedecinRegisteredResponse from(User user, String inpe, String specialite, String ville) {
        return new MedecinRegisteredResponse(
                user.getId(),
                user.getEmail(),
                user.getPhone(),
                user.getFirstName(),
                user.getLastName(),
                inpe,
                specialite,
                ville,
                user.getRole(),
                user.getLang(),
                user.getCreatedAt());
    }
}
