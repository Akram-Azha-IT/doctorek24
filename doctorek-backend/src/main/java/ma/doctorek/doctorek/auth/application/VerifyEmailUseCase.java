package ma.doctorek.doctorek.auth.application;

import ma.doctorek.doctorek.auth.application.dto.VerifyEmailRequest;
import ma.doctorek.doctorek.auth.domain.*;
import ma.doctorek.doctorek.notification.EmailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class VerifyEmailUseCase {

    private final UserRepository userRepository;
    private final EmailService   emailService;

    public VerifyEmailUseCase(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService   = emailService;
    }

    @Transactional
    public void execute(VerifyEmailRequest request) {
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
        emailService.sendBienvenueInscription(user.getEmail(), user.getFirstName(),
            user.getRole().name());
    }
}
