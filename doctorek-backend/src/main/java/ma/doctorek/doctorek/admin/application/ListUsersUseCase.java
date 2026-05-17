package ma.doctorek.doctorek.admin.application;

import ma.doctorek.doctorek.admin.application.dto.UserSummaryResponse;
import ma.doctorek.doctorek.admin.application.dto.UsersPageResponse;
import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.domain.User;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import ma.doctorek.doctorek.carte.application.GetCarteUseCase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ListUsersUseCase {

    private final UserRepository userRepository;
    private final GetCarteUseCase getCarte;

    public ListUsersUseCase(UserRepository userRepository, GetCarteUseCase getCarte) {
        this.userRepository = userRepository;
        this.getCarte = getCarte;
    }

    public UsersPageResponse execute(String roleFilter, String search, int page, int size) {
        List<Role> roles = resolveRoles(roleFilter);
        String s = search == null ? "" : search.trim();

        List<UserSummaryResponse> users = userRepository
                .findByRoleInWithSearch(roles, s, page, size)
                .stream()
                .map(this::toResponse)
                .toList();

        long total = userRepository.countByRoleInWithSearch(roles, s);
        return new UsersPageResponse(users, total, page, size);
    }

    private List<Role> resolveRoles(String roleFilter) {
        if (roleFilter == null || roleFilter.isBlank()) {
            return List.of(Role.PATIENT, Role.MEDECIN);
        }
        return switch (roleFilter.toUpperCase()) {
            case "PATIENT" -> List.of(Role.PATIENT);
            case "MEDECIN" -> List.of(Role.MEDECIN);
            default        -> List.of(Role.PATIENT, Role.MEDECIN);
        };
    }

    private UserSummaryResponse toResponse(User u) {
        boolean hasCarte = u.getRole() == Role.PATIENT
                && getCarte.existsByPatientId(UUID.fromString(u.getId().toString()));
        return new UserSummaryResponse(
                u.getId().toString(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getRole().name(),
                null,
                null,
                u.isActive(),
                u.isEmailVerified(),
                u.getCreatedAt() != null ? u.getCreatedAt().toString() : null,
                hasCarte
        );
    }
}
