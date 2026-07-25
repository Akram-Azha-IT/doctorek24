package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.AdminStatsResponse;
import ma.doctorek.doctorek.dto.CarteSummaryResponse;
import ma.doctorek.doctorek.dto.CartesPageResponse;
import ma.doctorek.doctorek.dto.UserSummaryResponse;
import ma.doctorek.doctorek.dto.UsersPageResponse;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.enums.UserStatus;
import ma.doctorek.doctorek.exception.CannotDeleteAdminException;
import ma.doctorek.doctorek.exception.CannotDeleteSelfException;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.repository.CarteVirtuelleRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.security.KeycloakAdminClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final RendezVousRepository rdvRepository;
    private final CarteVirtuelleRepository carteRepository;
    private final CarteService carteService;
    private final KeycloakAdminClient keycloakAdminClient;

    public AdminService(UserRepository userRepository,
                         RendezVousRepository rdvRepository,
                         CarteVirtuelleRepository carteRepository,
                         CarteService carteService,
                         KeycloakAdminClient keycloakAdminClient) {
        this.userRepository      = userRepository;
        this.rdvRepository       = rdvRepository;
        this.carteRepository     = carteRepository;
        this.carteService        = carteService;
        this.keycloakAdminClient = keycloakAdminClient;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
            userRepository.countByRoleAndStatus(Role.PATIENT, UserStatus.ACTIVE),
            userRepository.countByRoleAndStatus(Role.MEDECIN, UserStatus.ACTIVE),
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

    /**
     * Supprime un compte : anonymise son identité en base (libère email/téléphone
     * pour une ré-inscription) et supprime l'identité Keycloak. Les données médicales
     * liées sont conservées (rétention légale), rattachées à une coquille anonyme.
     *
     * Garde-fous : un admin ne peut ni se supprimer lui-même, ni supprimer un autre admin.
     *
     * @param adminEmail email de l'admin authentifié (empêche l'auto-suppression)
     * @param targetId   id du compte à supprimer
     */
    @Transactional
    public void deleteUser(String adminEmail, UUID targetId) {
        User target = userRepository.findById(targetId)
            .orElseThrow(() -> new UserNotFoundException(targetId));

        if (target.getStatus() == UserStatus.DELETED) {
            return; // idempotent : déjà supprimé
        }

        boolean isSelf = adminEmail != null && adminEmail.equalsIgnoreCase(target.getEmail());
        if (isSelf) {
            throw new CannotDeleteSelfException();
        }
        if (target.getRole() == Role.ADMIN) {
            throw new CannotDeleteAdminException();
        }

        // 1. Identité Keycloak (best-effort : libère le login sans bloquer la transaction DB)
        String keycloakId = target.getKeycloakId();
        if (keycloakId != null) {
            try {
                keycloakAdminClient.deleteUser(keycloakId);
            } catch (Exception e) {
                log.warn("Keycloak delete failed for user {} (kc={}): {}", targetId, keycloakId, e.getMessage());
            }
        }

        // 2. Anonymisation DB — libère email/téléphone, coupe le lien Keycloak, bloque le login
        target.anonymize();
        userRepository.save(target);
        log.info("User {} anonymisé/supprimé par l'admin {}", targetId, adminEmail);
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
