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
import java.time.Month;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * E-mail annonçant une place libérée.
 *
 * <p>Il doit dire la règle du premier arrivé : sans cela, le patient qui trouve le
 * créneau déjà pris croit à une erreur de la plateforme.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EmailPlaceLibereeTest {

    @Mock private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender, "no-reply@doctorek.ma", true);
        when(mailSender.createMimeMessage())
            .thenAnswer(i -> new org.springframework.mail.javamail.JavaMailSenderImpl().createMimeMessage());
    }

    private RendezVousEntity libere() {
        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setId(UUID.randomUUID());
        rdv.setDateRdv(LocalDate.of(2026, Month.SEPTEMBER, 15));
        rdv.setHeureRdv(LocalTime.of(9, 30));
        rdv.setDuree(30);
        return rdv;
    }

    private String contenu(MimeMessage message) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        message.writeTo(out);
        return out.toString("UTF-8");
    }

    @Test
    @DisplayName("l'e-mail porte le médecin, l'horaire et la règle du premier arrivé")
    void sendPlaceLiberee_contientLEssentiel() throws Exception {
        // Arrange
        var captor = org.mockito.ArgumentCaptor.forClass(MimeMessage.class);

        // Act
        emailService.sendPlaceLiberee("patient@test.ma", libere(), "Dr. Hakim Tazi");

        // Assert
        verify(mailSender).send(captor.capture());
        String corps = contenu(captor.getValue());
        assertThat(corps).contains("Hakim");
        assertThat(corps.replace("=\r\n", "")).contains("premier");
    }

    @Test
    @DisplayName("rien n'est envoyé quand l'expédition est désactivée")
    void sendPlaceLiberee_desactive_nEnvoieRien() {
        // Arrange
        EmailService desactive = new EmailService(mailSender, "no-reply@doctorek.ma", false);

        // Act
        desactive.sendPlaceLiberee("patient@test.ma", libere(), "Dr. Hakim Tazi");

        // Assert
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
