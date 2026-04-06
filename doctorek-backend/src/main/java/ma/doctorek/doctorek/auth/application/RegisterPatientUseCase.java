package ma.doctorek.doctorek.auth.application;

import ma.doctorek.doctorek.auth.application.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.auth.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegisterPatientUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegisterPatientUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
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

        User saved = userRepository.save(user);
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
