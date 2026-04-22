package ma.doctorek.doctorek.auth.application;

import ma.doctorek.doctorek.auth.application.dto.VerifyEmailRequest;
import ma.doctorek.doctorek.auth.domain.*;
import ma.doctorek.doctorek.notification.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VerifyEmailUseCase")
class VerifyEmailUseCaseTest {

    @Mock private UserRepository userRepository;
    @Mock private EmailService   emailService;

    private VerifyEmailUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new VerifyEmailUseCase(userRepository, emailService);
    }

    @Test
    @DisplayName("valid code → marks email verified and sends welcome email")
    void execute_validCode_verifiesEmail() {
        UUID userId = UUID.randomUUID();
        User user = userWithCode(userId, "123456", Instant.now().plus(10, ChronoUnit.MINUTES));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        useCase.execute(new VerifyEmailRequest(userId, "123456"));

        assertThat(user.isEmailVerified()).isTrue();
        assertThat(user.getVerificationCode()).isNull();
        verify(emailService).sendBienvenueInscription(eq(user.getEmail()), eq(user.getFirstName()), anyString());
    }

    @Test
    @DisplayName("wrong code → throws InvalidVerificationCodeException")
    void execute_wrongCode_throws() {
        UUID userId = UUID.randomUUID();
        User user = userWithCode(userId, "123456", Instant.now().plus(10, ChronoUnit.MINUTES));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> useCase.execute(new VerifyEmailRequest(userId, "000000")))
            .isInstanceOf(InvalidVerificationCodeException.class);

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendBienvenueInscription(any(), any(), any());
    }

    @Test
    @DisplayName("expired code → throws VerificationCodeExpiredException")
    void execute_expiredCode_throws() {
        UUID userId = UUID.randomUUID();
        User user = userWithCode(userId, "123456", Instant.now().minus(1, ChronoUnit.MINUTES));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> useCase.execute(new VerifyEmailRequest(userId, "123456")))
            .isInstanceOf(VerificationCodeExpiredException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("unknown userId → throws UserNotFoundException")
    void execute_unknownUser_throws() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(new VerifyEmailRequest(userId, "123456")))
            .isInstanceOf(UserNotFoundException.class);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User userWithCode(UUID id, String code, Instant expiresAt) {
        User user = User.builder()
            .email("alice@example.com")
            .password("$2a$hashed")
            .firstName("Alice")
            .lastName("Dupont")
            .role(Role.PATIENT)
            .lang("fr")
            .build();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiresAt(expiresAt);
        return user;
    }
}
