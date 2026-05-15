package ma.doctorek.doctorek.auth.application;

import ma.doctorek.doctorek.auth.application.dto.MedecinRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterMedecinRequest;
import ma.doctorek.doctorek.auth.domain.*;
import ma.doctorek.doctorek.notification.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RegisterMedecinUseCase")
class RegisterMedecinUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MedecinProfileCreatePort medecinProfileCreatePort;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private RegisterMedecinUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new RegisterMedecinUseCase(userRepository, medecinProfileCreatePort, passwordEncoder, emailService);
    }

    @Test
    @DisplayName("valid data → creates médecin, sends verification code, returns response")
    void execute_withValidData_createsMedecin() {
        RegisterMedecinRequest request = validRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(medecinProfileCreatePort.existsByInpe(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenReturn(mockSavedUser());

        MedecinRegisteredResponse response = useCase.execute(request);

        assertThat(response.email()).isEqualTo("dr.hassan@example.com");
        assertThat(response.role()).isEqualTo(Role.MEDECIN);
        assertThat(response.inpe()).isEqualTo("1234567890");
        assertThat(response.specialite()).isEqualTo("Cardiologie");
        verify(emailService).sendVerificationCode(eq("dr.hassan@example.com"), eq("Hassan"), anyString());
        verify(emailService, never()).sendBienvenueInscription(any(), any(), any());
        verify(medecinProfileCreatePort).create(any(), eq("1234567890"), eq("Cardiologie"), eq("Casablanca"), any());
    }

    @Test
    @DisplayName("existing email → throws EmailAlreadyExistsException")
    void execute_withExistingEmail_throwsException() {
        when(userRepository.existsByEmail("dr.hassan@example.com")).thenReturn(true);

        assertThatThrownBy(() -> useCase.execute(validRequest()))
            .isInstanceOf(EmailAlreadyExistsException.class)
            .hasMessageContaining("dr.hassan@example.com");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("existing phone → throws PhoneAlreadyExistsException")
    void execute_withExistingPhone_throwsException() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone("+212661234567")).thenReturn(true);

        assertThatThrownBy(() -> useCase.execute(validRequest()))
            .isInstanceOf(PhoneAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("existing INPE → throws InpeAlreadyExistsException")
    void execute_withExistingInpe_throwsException() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(medecinProfileCreatePort.existsByInpe("1234567890")).thenReturn(true);

        assertThatThrownBy(() -> useCase.execute(validRequest()))
            .isInstanceOf(InpeAlreadyExistsException.class)
            .hasMessageContaining("1234567890");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("password is encoded before saving")
    void execute_passwordIsEncoded() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(medecinProfileCreatePort.existsByInpe(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenReturn(mockSavedUser());

        useCase.execute(validRequest());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("$2a$hashed");
        assertThat(captor.getValue().getPassword()).doesNotContain("password123");
    }

    @Test
    @DisplayName("phone 06XXXXXXXX is normalized to +212XXXXXXXXX")
    void execute_phoneIsNormalized() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(medecinProfileCreatePort.existsByInpe(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenReturn(mockSavedUser());

        useCase.execute(validRequest());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPhone()).isEqualTo("+212661234567");
    }

    @Test
    @DisplayName("role is set to MEDECIN regardless of input")
    void execute_roleIsAlwaysMedecin() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(medecinProfileCreatePort.existsByInpe(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenReturn(mockSavedUser());

        useCase.execute(validRequest());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(Role.MEDECIN);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private RegisterMedecinRequest validRequest() {
        return new RegisterMedecinRequest(
            "dr.hassan@example.com", "0661234567", "password123",
            "Hassan", "Alaoui", "1234567890", "Cardiologie", "Casablanca", "Rue des Fleurs 10", "fr"
        );
    }

    private User mockSavedUser() {
        return User.builder()
            .email("dr.hassan@example.com")
            .phone("+212661234567")
            .password("$2a$hashed")
            .firstName("Hassan")
            .lastName("Alaoui")
            .role(Role.MEDECIN)
            .lang("fr")
            .build();
    }
}
