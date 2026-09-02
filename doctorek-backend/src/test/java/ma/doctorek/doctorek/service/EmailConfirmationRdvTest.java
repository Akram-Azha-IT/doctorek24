package ma.doctorek.doctorek.service;

import jakarta.mail.internet.MimeMessage;
import ma.doctorek.doctorek.entity.RendezVousEntity;
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
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EmailConfirmationRdvTest {

    private static final UUID RDV_ID = UUID.fromString("dc7adaab-cc6d-4c39-b1ba-4dbd9323f92f");

    @Mock private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(
                mailSender,
                "no-reply@doctorek.ma",
                true,
                "https://doctorek.ma/");
        when(mailSender.createMimeMessage())
                .thenAnswer(i -> new org.springframework.mail.javamail.JavaMailSenderImpl().createMimeMessage());
    }

    @Test
    @DisplayName("la confirmation utilise le ticket agenda, des liens actifs et aucune image")
    void sendConfirmationRdv_usesCalendarFirstTemplateWithoutImage() throws Exception {
        var captor = org.mockito.ArgumentCaptor.forClass(MimeMessage.class);

        emailService.sendConfirmationRdv("patient@test.ma", rendezVous());

        verify(mailSender).send(captor.capture());
        String message = contenu(captor.getValue()).replace("=\r\n", "");
        assertThat(message)
                .contains("09h00")
                .contains("calendar.google.com/calendar/render")
                .contains("Africa%2FCasablanca")
                .contains("https://doctorek.ma/dashboard/patient/rdvs")
                .doesNotContain("30 minutes")
                .doesNotContain("Dur=C3=A9e")
                .doesNotContain("https://doctorek.ma//dashboard")
                .doesNotContain("Content-ID:")
                .doesNotContain("Content-Type: image/")
                .doesNotContain("<img");
    }

    private RendezVousEntity rendezVous() {
        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setId(RDV_ID);
        rdv.setDateRdv(LocalDate.of(2026, 8, 28));
        rdv.setHeureRdv(LocalTime.of(9, 0));
        rdv.setDuree(30);
        rdv.setMotif("test");
        return rdv;
    }

    private String contenu(MimeMessage message) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        message.writeTo(out);
        return out.toString("UTF-8");
    }
}
