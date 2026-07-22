package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.exception.RateLimitExceededException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Limiteur de fréquence par utilisateur (fenêtre fixe, compteur Redis atomique).
 *
 * Clé : rl:{action}:{userId}. INCR incrémente atomiquement ; sur la 1re occurrence on pose
 * l'expiration = durée de la fenêtre. Au-delà de la limite → RateLimitExceededException (429).
 * Défense anti-flood (un patient authentifié qui inonde messages/fichiers).
 */
@Service
public class RateLimiterService {

    private final StringRedisTemplate redis;

    public RateLimiterService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * Incrémente le compteur de l'utilisateur pour l'action et rejette si la limite est dépassée.
     * Fail-open : si Redis est indisponible, on n'incrémente pas et on laisse passer (la messagerie
     * ne doit pas tomber si le cache tombe) — le rate limiting est une protection, pas un point de panne.
     */
    public void checkAndIncrement(String action, UUID userId, int limit, Duration window) {
        String key = "rl:" + action + ":" + userId;
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, window);
            }
            if (count != null && count > limit) {
                throw new RateLimitExceededException(
                        "Trop de requêtes. Réessayez dans " + window.toSeconds() + " s.");
            }
        } catch (RateLimitExceededException e) {
            throw e;
        } catch (Exception e) {
            // Redis KO → on ne bloque pas la messagerie (fail-open).
        }
    }
}
