package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;

import java.util.UUID;

public record CurrentUserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        Role role,
        String avatarUrl) {

    public static CurrentUserResponse from(User user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getAvatarUrl());
    }
}
