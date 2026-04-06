package ma.doctorek.doctorek.auth.application;

import ma.doctorek.doctorek.auth.application.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.auth.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RegisterPatientUseCase")
class RegisterPatientUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private RegisterPatientUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new RegisterPatientUseCase(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("valid data → creates patient and returns response")
    void execute_withValidData_createsPatient() {
        // Arrange
        RegisterPatientRequest request = new RegisterPatientRequest(
            "alice@example.com", "0612345678", "password123", "Alice", "Dupont", "fr"
        );
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");

        User savedUser = mockSavedUser("alice@example.com", "+212612345678", Role.PATIENT);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Act
        PatientRegisteredResponse response = useCase.execute(request);

        // Assert
        assertThat(response.email()).isEqualTo("alice@example.com");
        assertThat(response.role()).isEqualTo(Role.PATIENT);
        assertThat(response.phone()).isEqualTo("+212612345678");
    }

    @Test
    @DisplayName("existing email → throws EmailAlreadyExistsException")
    void execute_withExistingEmail_throwsException() {
        // Arrange
        RegisterPatientRequest request = new RegisterPatientRequest(
            "existing@example.com", "0612345678", "password123", "Alice", "Dupont", "fr"
        );
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> useCase.execute(request))
            .isInstanceOf(EmailAlreadyExistsException.class)
            .hasMessageContaining("existing@example.com");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("existing phone → throws PhoneAlreadyExistsException")
    void execute_withExistingPhone_throwsException() {
        // Arrange
        RegisterPatientRequest request = new RegisterPatientRequest(
            "new@example.com", "0612345678", "password123", "Alice", "Dupont", "fr"
        );
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone("+212612345678")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> useCase.execute(request))
            .isInstanceOf(PhoneAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("password is encoded before saving")
    void execute_passwordIsEncoded() {
        // Arrange
        RegisterPatientRequest request = new RegisterPatientRequest(
            "alice@example.com", "0612345678", "plainPassword", "Alice", "Dupont", "fr"
        );
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(passwordEncoder.encode("plainPassword")).thenReturn("$2a$hashed");

        User savedUser = mockSavedUser("alice@example.com", "+212612345678", Role.PATIENT);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Act
        useCase.execute(request);

        // Assert — password is encoded, never stored in plain text
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("$2a$hashed");
        assertThat(captor.getValue().getPassword()).doesNotContain("plainPassword");
    }

    @Test
    @DisplayName("phone 06XXXXXXXX is normalized to +212XXXXXXXXX")
    void execute_phoneIsNormalized() {
        // Arrange
        RegisterPatientRequest request = new RegisterPatientRequest(
            "alice@example.com", "0698765432", "password123", "Alice", "Dupont", "fr"
        );
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");

        User savedUser = mockSavedUser("alice@example.com", "+212698765432", Role.PATIENT);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Act
        useCase.execute(request);

        // Assert — phone stored in international format
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPhone()).isEqualTo("+212698765432");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User mockSavedUser(String email, String phone, Role role) {
        User user = User.builder()
            .email(email)
            .phone(phone)
            .password("$2a$hashed")
            .firstName("Alice")
            .lastName("Dupont")
            .role(role)
            .lang("fr")
            .build();
        // Simulate @PrePersist via reflection is complex; return as-is for unit tests
        return user;
    }
}
