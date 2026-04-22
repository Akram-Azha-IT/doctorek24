package ma.doctorek.doctorek.auth.application;

import ma.doctorek.doctorek.auth.application.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.auth.domain.*;
import ma.doctorek.doctorek.notification.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class RegisterPatientUseCase {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService    emailService;

    public RegisterPatientUseCase(UserRepository userRepository,
                                  PasswordEncoder passwordEncoder,
                                  EmailService emailService) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService    = emailService;
    }

    @Transactional
    public PatientRegisteredResponse execute(RegisterPatientRequest request) {
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
        emailService.sendVerificationCode(saved.getEmail(), saved.getFirstName(), code);
        return PatientRegisteredResponse.from(saved);
    }

    // Normalize Moroccan phone numbers to +212XXXXXXXXX format
    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String cleaned = phone.strip();
        if (cleaned.startsWith("0")) {
            return "+212" + cleaned.substring(1);
        }
        return cleaned;
    }
}
