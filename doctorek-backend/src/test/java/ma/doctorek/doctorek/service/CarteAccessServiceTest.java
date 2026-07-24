package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.CarteAccessResponse;
import ma.doctorek.doctorek.dto.CarteSensibleResponse;
import ma.doctorek.doctorek.dto.OtpChallengeResponse;
import ma.doctorek.doctorek.service.CarteService.OtpTarget;
import ma.doctorek.doctorek.service.otp.OtpSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarteAccessServiceTest {

    @Mock CarteService carteService;
    @Mock OtpSender otpSender;
    @Mock RateLimiterService rateLimiter;
    @Mock StringRedisTemplate redis;
    @Mock ValueOperations<String, String> ops;

    CarteAccessService service;
    final String cardRef = "VMC-2026-ABCD1234";

    @BeforeEach
    void setUp() {
        service = new CarteAccessService(carteService, otpSender, rateLimiter, redis);
    }

    @Test
    @DisplayName("requestOtp : envoie le code au patient et masque l'email")
    void requestOtp_sendsCodeToPatient_masksEmail() {
        when(redis.opsForValue()).thenReturn(ops);
        when(carteService.getOtpTargetByCardRef(cardRef))
                .thenReturn(new OtpTarget(UUID.randomUUID(), "amine@gmail.com", "Amine"));

        OtpChallengeResponse res = service.requestOtp(cardRef);

        assertThat(res.maskedDestination()).isEqualTo("a***@gmail.com");
        assertThat(res.expiresInSec()).isEqualTo(300);
        // Le code stocké dans Redis est un hash, jamais le code brut
        ArgumentCaptor<String> stored = ArgumentCaptor.forClass(String.class);
        verify(ops).set(eq("carte:otp:" + cardRef), stored.capture(), eq(Duration.ofMinutes(5)));
        assertThat(stored.getValue()).hasSize(64); // SHA-256 hex
        verify(otpSender).send(eq("amine@gmail.com"), anyString(), eq("Amine"));
        verify(rateLimiter).checkAndIncrementKey(eq("carte-otp-req"), eq(cardRef), anyInt(), any());
    }

    @Test
    @DisplayName("requestOtp : refuse si le patient n'a pas d'email")
    void requestOtp_noEmail_throws() {
        when(carteService.getOtpTargetByCardRef(cardRef))
                .thenReturn(new OtpTarget(UUID.randomUUID(), " ", "Amine"));

        assertThatThrownBy(() -> service.requestOtp(cardRef))
                .isInstanceOf(IllegalStateException.class);
        verify(otpSender, never()).send(any(), any(), any());
    }

    @Test
    @DisplayName("verifyOtp : mauvais code -> IllegalArgumentException, pas de jeton")
    void verifyOtp_wrongCode_throws() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get("carte:otp:" + cardRef)).thenReturn("un-hash-qui-ne-correspond-pas");

        assertThatThrownBy(() -> service.verifyOtp(cardRef, "000000"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ops, never()).set(startsWith("carte:grant:"), anyString(), any());
    }

    @Test
    @DisplayName("verifyOtp : code expiré/absent -> IllegalArgumentException")
    void verifyOtp_expired_throws() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get("carte:otp:" + cardRef)).thenReturn(null);

        assertThatThrownBy(() -> service.verifyOtp(cardRef, "123456"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("OTP correct : verifyOtp délivre un jeton, consomme le code")
    void verifyOtp_correct_issuesToken() {
        when(redis.opsForValue()).thenReturn(ops);
        // Reproduit le hash interne pour simuler un code valide en base
        String hash = sha256Hex(cardRef + ":123456");
        when(ops.get("carte:otp:" + cardRef)).thenReturn(hash);

        CarteAccessResponse res = service.verifyOtp(cardRef, "123456");

        assertThat(res.accessToken()).isNotBlank();
        assertThat(res.expiresInSec()).isEqualTo(900);
        verify(redis).delete("carte:otp:" + cardRef); // usage unique
        verify(ops).set(startsWith("carte:grant:"), eq(cardRef), eq(Duration.ofMinutes(15)));
    }

    @Test
    @DisplayName("getSensible : jeton absent -> SecurityException")
    void getSensible_noToken_throws() {
        assertThatThrownBy(() -> service.getSensible(cardRef, " "))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    @DisplayName("getSensible : jeton lié à une autre carte -> SecurityException")
    void getSensible_tokenBoundToOtherCard_throws() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get("carte:grant:tok")).thenReturn("VMC-2026-AUTRE");

        assertThatThrownBy(() -> service.getSensible(cardRef, "tok"))
                .isInstanceOf(SecurityException.class);
        verify(carteService, never()).getSensibleByCardRef(any());
    }

    @Test
    @DisplayName("getSensible : jeton valide -> renvoie les données sensibles")
    void getSensible_validToken_returnsData() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get("carte:grant:tok")).thenReturn(cardRef);
        CarteSensibleResponse sensible = new CarteSensibleResponse(
                List.of(), List.of(), List.of(), List.of(), "Dr X", "CNSS", "123", null);
        when(carteService.getSensibleByCardRef(cardRef)).thenReturn(sensible);

        assertThat(service.getSensible(cardRef, "tok")).isSameAs(sensible);
    }

    @Test
    @DisplayName("maskEmail : masque le nom, garde le domaine")
    void maskEmail_masksLocalPart() {
        assertThat(CarteAccessService.maskEmail("bob@doctorek.ma")).isEqualTo("b***@doctorek.ma");
        assertThat(CarteAccessService.maskEmail("a@x.ma")).startsWith("***");
    }

    private static String sha256Hex(String s) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(md.digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
