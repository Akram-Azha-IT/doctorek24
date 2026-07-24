package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.CarteAccessResponse;
import ma.doctorek.doctorek.dto.CarteSensibleResponse;
import ma.doctorek.doctorek.dto.OtpChallengeResponse;
import ma.doctorek.doctorek.service.CarteService.OtpTarget;
import ma.doctorek.doctorek.service.otp.OtpSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Accès en deux temps à la partie sensible d'une carte scannée (QR public).
 *
 * 1. requestOtp  : code à 6 chiffres envoyé au PATIENT (consentement), haché dans Redis (TTL court).
 * 2. verifyOtp   : code validé -> jeton d'accès opaque en Redis (TTL court) lié au cardRef.
 * 3. getSensible : le jeton (header) déverrouille les données sensibles, jamais avant.
 *
 * Le sensible ne quitte le serveur qu'avec un jeton valide : cacher côté UI ne suffirait pas.
 * Rate limiting Redis contre le brute-force du code à 6 chiffres. Fail-* : voir chaque étape.
 */
@Service
public class CarteAccessService {

    private static final Logger log = LoggerFactory.getLogger(CarteAccessService.class);

    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final Duration GRANT_TTL = Duration.ofMinutes(15);
    private static final int MAX_OTP_REQUESTS = 3;      // par cardRef / 10 min
    private static final Duration OTP_REQ_WINDOW = Duration.ofMinutes(10);
    private static final int MAX_VERIFY_ATTEMPTS = 5;   // par cardRef / TTL du code
    private static final SecureRandom RNG = new SecureRandom();

    private final CarteService carteService;
    private final OtpSender otpSender;
    private final RateLimiterService rateLimiter;
    private final StringRedisTemplate redis;

    public CarteAccessService(CarteService carteService,
                              OtpSender otpSender,
                              RateLimiterService rateLimiter,
                              StringRedisTemplate redis) {
        this.carteService = carteService;
        this.otpSender = otpSender;
        this.rateLimiter = rateLimiter;
        this.redis = redis;
    }

    /** Génère un OTP et l'envoie au patient. Retourne la destination masquée. */
    public OtpChallengeResponse requestOtp(String cardRef) {
        // Anti-abus : borne le nombre de demandes par carte (envoi d'emails, énumération).
        rateLimiter.checkAndIncrementKey("carte-otp-req", cardRef, MAX_OTP_REQUESTS, OTP_REQ_WINDOW);

        OtpTarget target = carteService.getOtpTargetByCardRef(cardRef);
        if (target.email() == null || target.email().isBlank()) {
            throw new IllegalStateException("Le patient n'a pas d'email pour recevoir le code");
        }

        String code = String.format("%06d", RNG.nextInt(1_000_000));
        redis.opsForValue().set(otpKey(cardRef), hash(cardRef, code), OTP_TTL);
        redis.delete(attemptsKey(cardRef));

        String channel = otpSender.channel();
        otpSender.send(target.email(), code, target.firstName());
        log.info("OTP carte envoyé (canal={}) pour cardRef={}", channel, cardRef);

        return new OtpChallengeResponse(maskEmail(target.email()), OTP_TTL.toSeconds());
    }

    /** Valide le code ; si bon, délivre un jeton d'accès court. */
    public CarteAccessResponse verifyOtp(String cardRef, String code) {
        // Anti-brute-force du code à 6 chiffres.
        rateLimiter.checkAndIncrementKey("carte-otp-verify", cardRef, MAX_VERIFY_ATTEMPTS, OTP_TTL);

        String stored = redis.opsForValue().get(otpKey(cardRef));
        if (stored == null || !constantTimeEquals(stored, hash(cardRef, code))) {
            throw new IllegalArgumentException("Code invalide ou expiré");
        }
        redis.delete(otpKey(cardRef)); // usage unique

        String token = randomToken();
        redis.opsForValue().set(grantKey(token), cardRef, GRANT_TTL);
        log.info("Accès sensible carte accordé pour cardRef={}", cardRef);

        return new CarteAccessResponse(token, GRANT_TTL.toSeconds());
    }

    /** Lit la partie sensible si le jeton correspond bien à cette carte. */
    public CarteSensibleResponse getSensible(String cardRef, String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new SecurityException("Jeton d'accès manquant");
        }
        String boundRef = redis.opsForValue().get(grantKey(accessToken));
        if (boundRef == null || !boundRef.equals(cardRef)) {
            throw new SecurityException("Jeton d'accès invalide ou expiré");
        }
        return carteService.getSensibleByCardRef(cardRef);
    }

    private static String otpKey(String cardRef) { return "carte:otp:" + cardRef; }
    private static String attemptsKey(String cardRef) { return "rl:carte-otp-verify:" + cardRef; }
    private static String grantKey(String token) { return "carte:grant:" + token; }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RNG.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Hash du code (le code brut n'est jamais stocké), salé par le cardRef. */
    private static String hash(String cardRef, String code) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((cardRef + ":" + code).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("Hash OTP impossible", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    /** "amine@gmail.com" -> "a***@gmail.com" (ne révèle pas l'email complet). */
    static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "***" + (at >= 0 ? email.substring(at) : "");
        return email.charAt(0) + "***" + email.substring(at);
    }
}
