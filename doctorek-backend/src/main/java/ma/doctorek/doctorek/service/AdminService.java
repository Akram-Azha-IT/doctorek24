package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.AdminStatsResponse;
import ma.doctorek.doctorek.dto.CarteSummaryResponse;
import ma.doctorek.doctorek.dto.CartesPageResponse;
import ma.doctorek.doctorek.dto.UserSummaryResponse;
import ma.doctorek.doctorek.dto.UsersPageResponse;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.repository.CarteVirtuelleRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final RendezVousRepository rdvRepository;
    private final CarteVirtuelleRepository carteRepository;
    private final CarteService carteService;

    public AdminService(UserRepository userRepository,
                         RendezVousRepository rdvRepository,
                         CarteVirtuelleRepository carteRepository,
                         CarteService carteService) {
        this.userRepository  = userRepository;
        this.rdvRepository   = rdvRepository;
        this.carteRepository = carteRepository;
        this.carteService    = carteService;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
            userRepository.countByRole(Role.PATIENT),
            userRepository.countByRole(Role.MEDECIN),
            rdvRepository.count(),
            rdvRepository.countByDateRdv(LocalDate.now()),
            rdvRepository.countByStatut(StatutRdv.EN_ATTENTE.name()),
            carteRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public UsersPageResponse listUsers(String roleFilter, String search, int page, int size) {
        List<Role> roles = resolveRoles(roleFilter);
        String s = search == null ? "" : search.trim();

        Page<User> result = userRepository.findByRoleInWithSearch(roles, s, PageRequest.of(page, size));
        List<UserSummaryResponse> users = result.getContent().stream()
            .map(this::toUserSummary)
            .toList();
        long total = userRepository.countByRoleInWithSearch(roles, s);
        return new UsersPageResponse(users, total, page, size);
    }

    @Transactional
    public void toggleUserActive(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));
        user.setActive(!user.isActive());
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public CartesPageResponse listCartes(int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var result = carteRepository.findAll(pageable);
        return new CartesPageResponse(
            result.getContent().stream().map(CarteSummaryResponse::from).toList(),
            result.getTotalElements(),
            page,
            size
        );
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

    private UserSummaryResponse toUserSummary(User u) {
        boolean hasCarte = u.getRole() == Role.PATIENT
                && carteService.existsByPatientId(u.getId());
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
