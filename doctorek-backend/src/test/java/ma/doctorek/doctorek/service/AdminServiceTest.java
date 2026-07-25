package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.UserStatus;
import ma.doctorek.doctorek.exception.CannotDeleteAdminException;
import ma.doctorek.doctorek.exception.CannotDeleteSelfException;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.repository.CarteVirtuelleRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.security.KeycloakAdminClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RendezVousRepository rdvRepository;
    @Mock private CarteVirtuelleRepository carteRepository;
    @Mock private CarteService carteService;
    @Mock private KeycloakAdminClient keycloakAdminClient;

    private AdminService adminService;

    private static final String ADMIN_EMAIL = "admin@doctorek.ma";

    @BeforeEach
    void setUp() {
        adminService = new AdminService(userRepository, rdvRepository, carteRepository,
            carteService, keycloakAdminClient);
    }

    private User user(UUID id, String email, Role role, String keycloakId) {
        return User.builder()
            .id(id)
            .email(email)
            .password("hash")
            .firstName("Jean")
            .lastName("Dupont")
            .role(role)
            .keycloakId(keycloakId)
            .build();
    }

    @Test
    @DisplayName("deleteUser anonymise le compte, supprime Keycloak et libère l'email")
    void deleteUser_normalPatient_anonymizes() {
        UUID id = UUID.randomUUID();
        User target = user(id, "akram@azhar-cons.com", Role.PATIENT, "kc-123");
        when(userRepository.findById(id)).thenReturn(Optional.of(target));

        adminService.deleteUser(ADMIN_EMAIL, id);

        verify(keycloakAdminClient).deleteUser("kc-123");
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(UserStatus.DELETED);
        assertThat(saved.getDeletedAt()).isNotNull();
        assertThat(saved.getEmail()).isNotEqualTo("akram@azhar-cons.com");
        assertThat(saved.getEmail()).contains(id.toString());
        assertThat(saved.getKeycloakId()).isNull();
        assertThat(saved.isActive()).isFalse();
    }

    @Test
    @DisplayName("deleteUser refuse l'auto-suppression")
    void deleteUser_self_throws() {
        UUID id = UUID.randomUUID();
        User self = user(id, ADMIN_EMAIL, Role.ADMIN, "kc-self");
        when(userRepository.findById(id)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> adminService.deleteUser(ADMIN_EMAIL, id))
            .isInstanceOf(CannotDeleteSelfException.class);

        verify(userRepository, never()).save(any());
        verify(keycloakAdminClient, never()).deleteUser(anyString());
    }

    @Test
    @DisplayName("deleteUser refuse de supprimer un autre admin")
    void deleteUser_admin_throws() {
        UUID id = UUID.randomUUID();
        User otherAdmin = user(id, "root@doctorek.ma", Role.ADMIN, "kc-root");
        when(userRepository.findById(id)).thenReturn(Optional.of(otherAdmin));

        assertThatThrownBy(() -> adminService.deleteUser(ADMIN_EMAIL, id))
            .isInstanceOf(CannotDeleteAdminException.class);

        verify(userRepository, never()).save(any());
        verify(keycloakAdminClient, never()).deleteUser(anyString());
    }

    @Test
    @DisplayName("deleteUser est idempotent si le compte est déjà supprimé")
    void deleteUser_alreadyDeleted_noop() {
        UUID id = UUID.randomUUID();
        User target = user(id, "x@y.ma", Role.PATIENT, null);
        target.anonymize();
        when(userRepository.findById(id)).thenReturn(Optional.of(target));

        adminService.deleteUser(ADMIN_EMAIL, id);

        verify(userRepository, never()).save(any());
        verify(keycloakAdminClient, never()).deleteUser(anyString());
    }

    @Test
    @DisplayName("deleteUser lève UserNotFound si le compte n'existe pas")
    void deleteUser_missing_throws() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.deleteUser(ADMIN_EMAIL, id))
            .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    @DisplayName("deleteUser anonymise même si la suppression Keycloak échoue")
    void deleteUser_keycloakFailure_stillAnonymizes() {
        UUID id = UUID.randomUUID();
        User target = user(id, "a@b.ma", Role.MEDECIN, "kc-x");
        when(userRepository.findById(id)).thenReturn(Optional.of(target));
        doThrow(new RuntimeException("KC down")).when(keycloakAdminClient).deleteUser("kc-x");

        adminService.deleteUser(ADMIN_EMAIL, id);

        verify(userRepository).save(any(User.class));
        assertThat(target.getStatus()).isEqualTo(UserStatus.DELETED);
    }

    @Test
    @DisplayName("deleteUser sans identité Keycloak n'appelle pas Keycloak")
    void deleteUser_noKeycloakId_skipsKeycloak() {
        UUID id = UUID.randomUUID();
        User target = user(id, "n@o.ma", Role.PATIENT, null);
        when(userRepository.findById(id)).thenReturn(Optional.of(target));

        adminService.deleteUser(ADMIN_EMAIL, id);

        verify(keycloakAdminClient, never()).deleteUser(anyString());
        verify(userRepository).save(any(User.class));
    }
}
