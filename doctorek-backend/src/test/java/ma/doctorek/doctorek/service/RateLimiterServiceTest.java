package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimiterServiceTest {

    @Mock StringRedisTemplate redis;
    @Mock ValueOperations<String, String> ops;

    RateLimiterService limiter;
    UUID user = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        limiter = new RateLimiterService(redis);
    }

    @Test
    @DisplayName("1re requête : pose l'expiration et passe")
    void firstRequest_setsExpiryAndPasses() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.increment(anyString())).thenReturn(1L);

        limiter.checkAndIncrement("msg", user, 20, Duration.ofMinutes(1));

        verify(redis).expire(startsWith("rl:msg:"), eq(Duration.ofMinutes(1)));
    }

    @Test
    @DisplayName("sous la limite : passe sans exception")
    void underLimit_passes() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.increment(anyString())).thenReturn(20L);
        assertThatCode(() -> limiter.checkAndIncrement("msg", user, 20, Duration.ofMinutes(1)))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("au-delà de la limite : lève RateLimitExceededException")
    void overLimit_throws() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.increment(anyString())).thenReturn(21L);
        Duration window = Duration.ofMinutes(1);
        assertThatThrownBy(() -> limiter.checkAndIncrement("msg", user, 20, window))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    @DisplayName("Redis KO : fail-open, ne bloque pas la messagerie")
    void redisDown_failsOpen() {
        when(redis.opsForValue()).thenThrow(new RuntimeException("redis down"));
        assertThatCode(() -> limiter.checkAndIncrement("msg", user, 20, Duration.ofMinutes(1)))
                .doesNotThrowAnyException();
    }
}
