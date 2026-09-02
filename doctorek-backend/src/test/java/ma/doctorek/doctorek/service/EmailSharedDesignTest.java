package ma.doctorek.doctorek.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mail.javamail.JavaMailSender;

import java.io.ByteArrayOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EmailSharedDesignTest {

    @Mock private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(
                mailSender,
                "no-reply@doctorek.ma",
                true,
                "https://doctorek.ma");
        when(mailSender.createMimeMessage())
                .thenAnswer(i -> new org.springframework.mail.javamail.JavaMailSenderImpl().createMimeMessage());
    }

    @Test
    @DisplayName("l'email de bienvenue utilise le design partagé sans image")
    void sendBienvenue_usesSharedImageFreeDesign() throws Exception {
        var captor = org.mockito.ArgumentCaptor.forClass(MimeMessage.class);

        emailService.sendBienvenueInscription("patient@test.ma", "Akram", "PATIENT");

        verify(mailSender).send(captor.capture());
        assertSharedDesign(contenu(captor.getValue()))
                .contains("Bienvenue sur Doctorek")
                .contains("Akram");
    }

    @Test
    @DisplayName("le code d'accès utilise le design partagé sans image")
    void sendCarteAccessOtp_usesSharedImageFreeDesign() throws Exception {
        var captor = org.mockito.ArgumentCaptor.forClass(MimeMessage.class);

        emailService.sendCarteAccessOtp("patient@test.ma", "Akram", "123456");

        verify(mailSender).send(captor.capture());
        assertSharedDesign(contenu(captor.getValue()))
                .contains("123456")
                .contains("informations sensibles");
    }

    private org.assertj.core.api.AbstractStringAssert<?> assertSharedDesign(String message) {
        return assertThat(message.replace("=\r\n", ""))
                .contains("MESSAGE DOCTOREK")
                .contains("background:#F3F6FA")
                .contains("background:#00263C")
                .doesNotContain("Content-ID:")
                .doesNotContain("Content-Type: image/")
                .doesNotContain("<img");
    }

    private String contenu(MimeMessage message) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        message.writeTo(out);
        return out.toString("UTF-8");
    }
}
