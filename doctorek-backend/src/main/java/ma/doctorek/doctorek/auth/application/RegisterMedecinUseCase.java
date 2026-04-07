package ma.doctorek.doctorek.auth.application;

import ma.doctorek.doctorek.auth.application.dto.MedecinRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterMedecinRequest;
import ma.doctorek.doctorek.auth.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegisterMedecinUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegisterMedecinUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public MedecinRegisteredResponse execute(RegisterMedecinRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        String normalizedPhone = normalizePhone(request.phone());

        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new PhoneAlreadyExistsException(normalizedPhone);
        }

        if (userRepository.existsByInpe(request.inpe())) {
            throw new InpeAlreadyExistsException(request.inpe());
        }

        User user = User.builder()
            .email(request.email().toLowerCase().strip())
            .phone(normalizedPhone)
            .password(passwordEncoder.encode(request.password()))
            .firstName(request.firstName().strip())
            .lastName(request.lastName().strip())
            .role(Role.MEDECIN)
            .inpe(request.inpe().strip())
            .specialite(request.specialite().strip())
            .ville(request.ville().strip())
            .adresse(request.adresse() != null ? request.adresse().strip() : null)
            .lang(request.lang())
            .build();

        User saved = userRepository.save(user);
        return MedecinRegisteredResponse.from(saved);
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
