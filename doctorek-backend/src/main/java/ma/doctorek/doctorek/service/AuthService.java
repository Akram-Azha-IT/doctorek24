package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.LoginRequest;
import ma.doctorek.doctorek.dto.LoginResponse;
import ma.doctorek.doctorek.dto.MedecinRegisteredResponse;
import ma.doctorek.doctorek.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.dto.RefreshRequest;
import ma.doctorek.doctorek.dto.RefreshResponse;
import ma.doctorek.doctorek.dto.RegisterMedecinRequest;
import ma.doctorek.doctorek.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.dto.VerifyEmailRequest;
import ma.doctorek.doctorek.entity.MedecinDetailEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.exception.EmailAlreadyExistsException;
import ma.doctorek.doctorek.exception.InpeAlreadyExistsException;
import ma.doctorek.doctorek.exception.InvalidCredentialsException;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${keycloak.realm.access-token-lifespan:1800}")
    private int accessTokenLifespan;

    @Value("${keycloak.realm.sso-session-max-lifespan:28800}")
    private int ssoSessionMaxLifespan;

    private final UserRepository          userRepository;
    private final MedecinDetailRepository medecinRepository;
    private final PasswordEncoder         passwordEncoder;
    private final EmailService            emailService;
    private final KeycloakAdminClient     keycloakAdminClient;

    public AuthService(UserRepository userRepository,
                       MedecinDetailRepository medecinRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       KeycloakAdminClient keycloakAdminClient) {
        this.userRepository      = userRepository;
        this.medecinRepository   = medecinRepository;
        this.passwordEncoder     = passwordEncoder;
        this.emailService        = emailService;
        this.keycloakAdminClient = keycloakAdminClient;
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

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().strip())
            .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        KeycloakAdminClient.TokenPair tokens;
        try {
            tokens = keycloakAdminClient.loginUser(request.email(), request.password());
        } catch (Exception e) {
            log.error("Keycloak ROPC failed for {}: {}", request.email(), e.getMessage());
            throw new InvalidCredentialsException();
        }

        return new LoginResponse(
            tokens.accessToken(),
            tokens.refreshToken(),
            user.getId().toString(),
            user.getRole().name(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail()
        );
    }

    @Transactional(readOnly = true)
    public RefreshResponse refresh(RefreshRequest request) {
        try {
            String newAccessToken = keycloakAdminClient.refreshToken(request.refreshToken());
            return new RefreshResponse(newAccessToken);
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            throw new InvalidCredentialsException();
        }
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
