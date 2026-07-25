package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.exception.EmailAlreadyExistsException;
import ma.doctorek.doctorek.repository.MedecinDetailRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.security.KeycloakAdminClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceReRegisterTest {

    @Mock private UserRepository userRepository;
    @Mock private MedecinDetailRepository medecinRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private KeycloakAdminClient keycloakAdminClient;
    @Mock private CarteService carteService;

    private AuthService authService;

    private static final String EMAIL = "akram@azhar-cons.com";

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, medecinRepository, passwordEncoder,
            emailService, keycloakAdminClient, carteService);
    }

    private RegisterPatientRequest request() {
        return new RegisterPatientRequest(EMAIL, "password123", "Akram", "Azhar", "0612345678", "fr");
    }

    private User existing(boolean verified, String keycloakId) {
        return User.builder()
            .id(UUID.randomUUID())
            .email(EMAIL)
            .password("hash")
            .firstName("Akram")
            .lastName("Azhar")
            .role(Role.PATIENT)
            .keycloakId(keycloakId)
            .emailVerified(verified)
            .build();
    }

    private void stubHappyCreate() {
        when(passwordEncoder.encode(anyString())).thenReturn("enc");
        when(keycloakAdminClient.createUser(anyString(), anyString(), anyString(), anyString(), any()))
            .thenReturn("kc-new");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) u.setId(UUID.randomUUID());
            return u;
        });
    }

    @Test
    @DisplayName("Ré-inscription par-dessus un compte NON vérifié : purge puis crée")
    void register_overUnverified_purgesAndCreates() {
        User stale = existing(false, "kc-old");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(stale));
        when(userRepository.findByPhone(anyString())).thenReturn(Optional.empty());
        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        stubHappyCreate();

        authService.registerPatient(request());

        // Le compte fantôme est supprimé (Keycloak + DB) avant la ré-insertion
        verify(keycloakAdminClient).deleteUser("kc-old");
        verify(userRepository).delete(stale);
        verify(userRepository).flush();
        // Et un nouveau compte Keycloak est bien créé
        verify(keycloakAdminClient).createUser(anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Ré-inscription par-dessus un compte VÉRIFIÉ : rejet, aucune purge")
    void register_overVerified_throws() {
        User real = existing(true, "kc-real");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(real));
        when(userRepository.findByPhone(anyString())).thenReturn(Optional.empty());
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);
        RegisterPatientRequest req = request();

        assertThatThrownBy(() -> authService.registerPatient(req))
            .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).delete(any());
        verify(keycloakAdminClient, never()).deleteUser(anyString());
    }

    @Test
    @DisplayName("Inscription fraîche (aucun conflit) : crée sans purge")
    void register_fresh_createsWithoutPurge() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.findByPhone(anyString())).thenReturn(Optional.empty());
        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        stubHappyCreate();

        authService.registerPatient(request());

        verify(userRepository, never()).delete(any());
        verify(keycloakAdminClient, never()).deleteUser(anyString());
        verify(emailService).sendVerificationCode(anyString(), anyString(), anyString());
    }
}
