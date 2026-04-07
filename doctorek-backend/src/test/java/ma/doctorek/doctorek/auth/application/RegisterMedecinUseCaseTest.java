package ma.doctorek.doctorek.auth.application;

import ma.doctorek.doctorek.auth.application.dto.MedecinRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterMedecinRequest;
import ma.doctorek.doctorek.auth.domain.*;
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
    private PasswordEncoder passwordEncoder;

    private RegisterMedecinUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new RegisterMedecinUseCase(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("valid data → creates médecin with role MEDECIN and returns response")
    void execute_withValidData_createsMedecin() {
        // Arrange
        RegisterMedecinRequest request = new RegisterMedecinRequest(
            "dr.hassan@example.com", "0661234567", "password123",
            "Hassan", "Alaoui", "1234567890", "Cardiologie", "Casablanca", "Rue des Fleurs 10", "fr"
        );
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(userRepository.existsByInpe(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");

        User savedUser = mockSavedMedecin("dr.hassan@example.com", "+212661234567", "1234567890");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Act
        MedecinRegisteredResponse response = useCase.execute(request);

        // Assert
        assertThat(response.email()).isEqualTo("dr.hassan@example.com");
        assertThat(response.role()).isEqualTo(Role.MEDECIN);
        assertThat(response.inpe()).isEqualTo("1234567890");
        assertThat(response.specialite()).isEqualTo("Cardiologie");
    }

    @Test
    @DisplayName("existing email → throws EmailAlreadyExistsException")
    void execute_withExistingEmail_throwsException() {
        RegisterMedecinRequest request = validRequest();
        when(userRepository.existsByEmail("dr.hassan@example.com")).thenReturn(true);

        assertThatThrownBy(() -> useCase.execute(request))
            .isInstanceOf(EmailAlreadyExistsException.class)
            .hasMessageContaining("dr.hassan@example.com");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("existing phone → throws PhoneAlreadyExistsException")
    void execute_withExistingPhone_throwsException() {
        RegisterMedecinRequest request = validRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone("+212661234567")).thenReturn(true);

        assertThatThrownBy(() -> useCase.execute(request))
            .isInstanceOf(PhoneAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("existing INPE → throws InpeAlreadyExistsException")
    void execute_withExistingInpe_throwsException() {
        RegisterMedecinRequest request = validRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(userRepository.existsByInpe("1234567890")).thenReturn(true);

        assertThatThrownBy(() -> useCase.execute(request))
            .isInstanceOf(InpeAlreadyExistsException.class)
            .hasMessageContaining("1234567890");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("password is encoded before saving")
    void execute_passwordIsEncoded() {
        RegisterMedecinRequest request = validRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(userRepository.existsByInpe(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$hashed");

        User savedUser = mockSavedMedecin("dr.hassan@example.com", "+212661234567", "1234567890");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        useCase.execute(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("$2a$hashed");
        assertThat(captor.getValue().getPassword()).doesNotContain("password123");
    }

    @Test
    @DisplayName("phone 06XXXXXXXX is normalized to +212XXXXXXXXX")
    void execute_phoneIsNormalized() {
        RegisterMedecinRequest request = validRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(userRepository.existsByInpe(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");

        User savedUser = mockSavedMedecin("dr.hassan@example.com", "+212661234567", "1234567890");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        useCase.execute(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPhone()).isEqualTo("+212661234567");
    }

    @Test
    @DisplayName("role is set to MEDECIN regardless of input")
    void execute_roleIsAlwaysMedecin() {
        RegisterMedecinRequest request = validRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(userRepository.existsByInpe(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");

        User savedUser = mockSavedMedecin("dr.hassan@example.com", "+212661234567", "1234567890");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        useCase.execute(request);

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

    private User mockSavedMedecin(String email, String phone, String inpe) {
        return User.builder()
            .email(email)
            .phone(phone)
            .password("$2a$hashed")
            .firstName("Hassan")
            .lastName("Alaoui")
            .role(Role.MEDECIN)
            .inpe(inpe)
            .specialite("Cardiologie")
            .ville("Casablanca")
            .adresse("Rue des Fleurs 10")
            .lang("fr")
            .build();
    }
}
