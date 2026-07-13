package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.CarteVirtuelleRequest;
import ma.doctorek.doctorek.dto.CurrentUserResponse;
import ma.doctorek.doctorek.dto.MedecinRegisteredResponse;
import ma.doctorek.doctorek.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.dto.RegisterMedecinRequest;
import ma.doctorek.doctorek.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.dto.VerifyEmailRequest;
import ma.doctorek.doctorek.entity.MedecinDetailEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.exception.EmailAlreadyExistsException;
import ma.doctorek.doctorek.exception.InpeAlreadyExistsException;
import ma.doctorek.doctorek.exception.InvalidVerificationCodeException;
import ma.doctorek.doctorek.exception.PhoneAlreadyExistsException;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.exception.VerificationCodeExpiredException;
import ma.doctorek.doctorek.repository.MedecinDetailRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.security.KeycloakAdminClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    /** All-null medical fields — a blank card created on first social login. */
    private static final CarteVirtuelleRequest EMPTY_CARTE = new CarteVirtuelleRequest(
        null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

    @Value("${keycloak.realm.access-token-lifespan:1800}")
    private int accessTokenLifespan;

    @Value("${keycloak.realm.sso-session-max-lifespan:28800}")
    private int ssoSessionMaxLifespan;

    private final UserRepository          userRepository;
    private final MedecinDetailRepository medecinRepository;
    private final PasswordEncoder         passwordEncoder;
    private final EmailService            emailService;
    private final KeycloakAdminClient     keycloakAdminClient;
    private final CarteService            carteService;

    public AuthService(UserRepository userRepository,
                       MedecinDetailRepository medecinRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       KeycloakAdminClient keycloakAdminClient,
                       CarteService carteService) {
        this.userRepository      = userRepository;
        this.medecinRepository   = medecinRepository;
        this.passwordEncoder     = passwordEncoder;
        this.emailService        = emailService;
        this.keycloakAdminClient = keycloakAdminClient;
        this.carteService        = carteService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void configureKeycloakOnStartup() {
        try {
            keycloakAdminClient.configureTokenLifetimes(accessTokenLifespan, ssoSessionMaxLifespan);
        } catch (Exception e) {
            log.warn("Could not configure Keycloak token lifetimes on startup: {}", e.getMessage());
        }
    }

    @Transactional
    public PatientRegisteredResponse registerPatient(RegisterPatientRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        String normalizedPhone = normalizePhone(request.phone());
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new PhoneAlreadyExistsException(normalizedPhone);
        }

        User user = User.builder()
            .email(request.email().toLowerCase().strip())
            .phone(normalizedPhone)
            .password(passwordEncoder.encode(request.password()))
            .firstName(request.firstName().strip())
            .lastName(request.lastName().strip())
            .role(Role.PATIENT)
            .lang(request.lang())
            .build();

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setVerificationCode(code);
        user.setVerificationCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));

        User saved = userRepository.save(user);

        try {
            String keycloakId = keycloakAdminClient.createUser(
                saved.getEmail(), saved.getFirstName(), saved.getLastName(),
                request.password(), Role.PATIENT);
            saved.setKeycloakId(keycloakId);
            userRepository.save(saved);
        } catch (Exception e) {
            log.error("Keycloak user creation failed for patient {}: {}", saved.getId(), e.getMessage());
        }

        emailService.sendVerificationCode(saved.getEmail(), saved.getFirstName(), code);
        return PatientRegisteredResponse.from(saved);
    }

    @Transactional
    public MedecinRegisteredResponse registerMedecin(RegisterMedecinRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        String normalizedPhone = normalizePhone(request.phone());
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new PhoneAlreadyExistsException(normalizedPhone);
        }

        if (medecinRepository.existsByInpe(request.inpe())) {
            throw new InpeAlreadyExistsException(request.inpe());
        }

        User user = User.builder()
            .email(request.email().toLowerCase().strip())
            .phone(normalizedPhone)
            .password(passwordEncoder.encode(request.password()))
            .firstName(request.firstName().strip())
            .lastName(request.lastName().strip())
            .role(Role.MEDECIN)
            .lang(request.lang())
            .build();

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setVerificationCode(code);
        user.setVerificationCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));

        User saved = userRepository.save(user);

        MedecinDetailEntity detail = new MedecinDetailEntity(
            saved,
            request.inpe().strip(),
            request.specialite().strip(),
            request.ville().strip(),
            null
        );
        medecinRepository.save(detail);

        try {
            String keycloakId = keycloakAdminClient.createUser(
                saved.getEmail(), saved.getFirstName(), saved.getLastName(),
                request.password(), Role.MEDECIN);
            saved.setKeycloakId(keycloakId);
            userRepository.save(saved);
        } catch (Exception e) {
            log.error("Keycloak user creation failed for medecin {}: {}", saved.getId(), e.getMessage());
        }

        emailService.sendVerificationCode(saved.getEmail(), saved.getFirstName(), code);
        return MedecinRegisteredResponse.from(saved, request.inpe().strip(),
            request.specialite().strip(), request.ville().strip());
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findById(request.userId())
            .orElseThrow(() -> new UserNotFoundException(request.userId()));

        if (user.getVerificationCodeExpiresAt() == null
                || Instant.now().isAfter(user.getVerificationCodeExpiresAt())) {
            throw new VerificationCodeExpiredException();
        }

        if (!request.code().equals(user.getVerificationCode())) {
            throw new InvalidVerificationCodeException();
        }

        user.markEmailVerified();
        userRepository.save(user);

        if (user.getKeycloakId() != null) {
            try {
                keycloakAdminClient.markEmailVerified(user.getKeycloakId());
            } catch (Exception e) {
                log.error("Failed to mark email verified in Keycloak for user {}: {}", user.getId(), e.getMessage());
            }
        }

        emailService.sendBienvenueInscription(user.getEmail(), user.getFirstName(),
            user.getRole().name());
    }

    /**
     * Bridges a Keycloak JWT to the local app account. Users created through the normal
     * register flow already have a row keyed by keycloakId. Users who arrived via a brokered
     * identity provider (e.g. "Continuer avec Google") have a Keycloak account but no local
     * row yet — provision one just-in-time so the dashboard, carte, name and avatar resolve.
     */
    @Transactional
    public CurrentUserResponse getCurrentUser(Jwt jwt) {
        String keycloakId = jwt.getSubject();

        Optional<User> byKeycloak = userRepository.findByKeycloakId(keycloakId);
        if (byKeycloak.isPresent()) {
            User user = backfillFromJwt(byKeycloak.get(), jwt);
            ensureRealmRole(jwt, user);
            ensureCarteForPatient(user);
            return CurrentUserResponse.from(user);
        }

        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            String normalizedEmail = email.toLowerCase().strip();

            // Existing local account (registered by email) now signing in via Google — link it.
            Optional<User> byEmail = userRepository.findByEmail(normalizedEmail);
            if (byEmail.isPresent()) {
                User existing = byEmail.get();
                existing.setKeycloakId(keycloakId);
                User user = backfillFromJwt(existing, jwt);
                ensureRealmRole(jwt, user);
                ensureCarteForPatient(user);
                return CurrentUserResponse.from(user);
            }

            User created = provisionPatientFromJwt(jwt, normalizedEmail, keycloakId);
            ensureRealmRole(jwt, created);
            ensureCarteForPatient(created);
            return CurrentUserResponse.from(created);
        }

        throw new UserNotFoundException("compte Keycloak " + keycloakId);
    }

    /**
     * The API is gated on the Keycloak realm role. Brokered (Google) sign-ins create a Keycloak
     * user with no realm role, so their token can't reach role-protected endpoints (403). When the
     * token is missing the user's role, assign it in Keycloak — it lands in the token on the next
     * issuance (refresh or re-login).
     */
    private void ensureRealmRole(Jwt jwt, User user) {
        if (user.getKeycloakId() == null) return;

        Object realmAccess = jwt.getClaim("realm_access");
        List<?> roles = (realmAccess instanceof Map<?, ?> m && m.get("roles") instanceof List<?> l)
            ? l : List.of();
        if (roles.contains(user.getRole().name())) return;

        try {
            keycloakAdminClient.assignRealmRole(user.getKeycloakId(), user.getRole());
            log.info("Assigned realm role {} to brokered user {} (keycloakId={})",
                user.getRole(), user.getId(), user.getKeycloakId());
        } catch (Exception e) {
            log.warn("Failed to assign realm role {} to user {}: {}",
                user.getRole(), user.getId(), e.getMessage());
        }
    }

    /** Heals rows whose name was missing at an earlier login (claims now available in the token). */
    private User backfillFromJwt(User user, Jwt jwt) {
        boolean changed = false;
        if (isBlank(user.getFirstName())) {
            String given = firstNonBlank(jwt.getClaimAsString("given_name"),
                jwt.getClaimAsString("name"));
            if (!given.isBlank()) { user.setFirstName(given.strip()); changed = true; }
        }
        if (isBlank(user.getLastName())) {
            String family = jwt.getClaimAsString("family_name");
            if (family != null && !family.isBlank()) { user.setLastName(family.strip()); changed = true; }
        }
        if (isBlank(user.getAvatarUrl())) {
            String picture = jwt.getClaimAsString("picture");
            if (picture != null && !picture.isBlank()) { user.setAvatarUrl(picture.strip()); changed = true; }
        }
        return changed ? userRepository.save(user) : user;
    }

    /**
     * Every patient gets a virtual medical card. Social-login patients never went through the
     * registration UI, so create an (empty) card on first resolve — the dashboard reads the
     * patient's name from it. No-op for non-patients or when a card already exists.
     */
    private void ensureCarteForPatient(User user) {
        if (user.getRole() != Role.PATIENT) return;
        if (carteService.existsByPatientId(user.getId())) return;
        try {
            carteService.create(EMPTY_CARTE, user.getId());
        } catch (Exception e) {
            log.warn("Auto carte creation failed for patient {}: {}", user.getId(), e.getMessage());
        }
    }

    /** Creates a local PATIENT account from the brokered identity provider's claims. */
    private User provisionPatientFromJwt(Jwt jwt, String email, String keycloakId) {
        String firstName = firstNonBlank(
            jwt.getClaimAsString("given_name"),
            jwt.getClaimAsString("name"),
            email.split("@")[0]);
        String lastName = firstNonBlank(jwt.getClaimAsString("family_name"), "");

        // Email coming from a verified Google account; the social broker is the source of truth
        // for credentials, so the local password is an unusable random placeholder (NOT NULL col).
        User user = User.builder()
            .email(email)
            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
            .firstName(firstName.strip())
            .lastName(lastName.strip())
            .role(Role.PATIENT)
            .keycloakId(keycloakId)
            .avatarUrl(emptyToNull(jwt.getClaimAsString("picture")))
            .emailVerified(Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")))
            .build();

        User saved = userRepository.save(user);
        log.info("Provisioned local PATIENT account {} from brokered login (keycloakId={})",
            saved.getId(), keycloakId);
        return saved;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return "";
    }

    private static boolean isBlank(String v) {
        return v == null || v.isBlank();
    }

    private static String emptyToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.strip();
    }

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String cleaned = phone.strip();
        if (cleaned.startsWith("0")) {
            return "+212" + cleaned.substring(1);
        }
        return cleaned;
    }
}
