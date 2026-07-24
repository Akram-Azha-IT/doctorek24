package ma.doctorek.doctorek.service.otp;

import ma.doctorek.doctorek.service.EmailService;
import org.springframework.stereotype.Component;

/** Envoi de l'OTP par email (Brevo SMTP), via le gabarit de marque existant. */
@Component
public class EmailOtpSender implements OtpSender {

    private final EmailService emailService;

    public EmailOtpSender(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void send(String destination, String code, String patientName) {
        emailService.sendCarteAccessOtp(destination, patientName, code);
    }

    @Override
    public String channel() {
        return "email";
    }
}
