package ma.doctorek.doctorek.notification;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService")
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private final UUID rdvId = UUID.fromString("11111111-2222-3333-4444-555555555555");

    // MONDAY 20 April 2026 @ 09:00 → 30 min, motif "Consultation"
    private final RendezVous rdv = new RendezVous(
        rdvId, UUID.randomUUID(), UUID.randomUUID(),
        LocalDate.of(2026, 4, 20),
        LocalTime.of(9, 0),
        30,
        StatutRdv.EN_ATTENTE,
        "Consultation",
        null,
        LocalDateTime.now()
    );

    private EmailService enabledService() {
        return new EmailService(mailSender, "no-reply@doctorek.ma", true);
    }

    private EmailService disabledService() {
        return new EmailService(mailSender, "no-reply@doctorek.ma", false);
    }

    @Nested
    @DisplayName("sendConfirmationRdv")
    class SendConfirmation {

        @Test
        @DisplayName("sends SimpleMailMessage with French date formatting and correct subject")
        void sendsConfirmationMail() {
            EmailService service = enabledService();

            service.sendConfirmationRdv("patient@example.com", rdv);

            ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            verify(mailSender).send(captor.capture());
            SimpleMailMessage sent = captor.getValue();

            assertThat(sent.getFrom()).isEqualTo("no-reply@doctorek.ma");
            assertThat(sent.getTo()).containsExactly("patient@example.com");
            assertThat(sent.getSubject()).isEqualTo("Confirmation de votre rendez-vous — Doctorek");
            assertThat(sent.getText())
                .contains("lundi 20 avril 2026")
                .contains("09h00")
                .contains("30 minutes")
                .contains("Consultation")
                .contains(rdvId.toString());
        }

        @Test
        @DisplayName("renders 'Non précisé' when motif is null")
        void nullMotifRendersFallback() {
            EmailService service = enabledService();
            RendezVous sansMotif = new RendezVous(
                rdvId, UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2026, 4, 20), LocalTime.of(9, 0),
                30, StatutRdv.EN_ATTENTE, null, null, LocalDateTime.now()
            );

            service.sendConfirmationRdv("patient@example.com", sansMotif);

            ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            verify(mailSender).send(captor.capture());
            assertThat(captor.getValue().getText()).contains("Non précisé");
        }

        @Test
        @DisplayName("does not send when doctorek.mail.enabled=false")
        void disabledDoesNotSend() {
            EmailService service = disabledService();

            service.sendConfirmationRdv("patient@example.com", rdv);

            verify(mailSender, never()).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("does not send when recipient is blank")
        void blankRecipientDoesNotSend() {
            EmailService service = enabledService();

            service.sendConfirmationRdv("", rdv);
            service.sendConfirmationRdv("   ", rdv);
            service.sendConfirmationRdv(null, rdv);

            verify(mailSender, never()).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("swallows mailer exceptions so use case does not fail")
        void swallowsMailerException() {
            EmailService service = enabledService();
            org.mockito.Mockito.doThrow(new RuntimeException("SMTP down"))
                .when(mailSender).send(any(SimpleMailMessage.class));

            service.sendConfirmationRdv("patient@example.com", rdv);

            verify(mailSender).send(any(SimpleMailMessage.class));
        }
    }

    @Nested
    @DisplayName("sendRappelRdv")
    class SendRappel {

        @Test
        @DisplayName("J-1 subject mentions 'demain'")
        void rappelJ1Subject() {
            EmailService service = enabledService();

            service.sendRappelRdv("patient@example.com", rdv, 1);

            ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            verify(mailSender).send(captor.capture());
            SimpleMailMessage sent = captor.getValue();

            assertThat(sent.getSubject()).isEqualTo("Rappel : votre rendez-vous est demain — Doctorek");
            assertThat(sent.getText())
                .contains("de demain")
                .contains("lundi 20 avril 2026")
                .contains("09h00");
        }

        @Test
        @DisplayName("J-2 subject mentions 'dans 2 jours'")
        void rappelJ2Subject() {
            EmailService service = enabledService();

            service.sendRappelRdv("patient@example.com", rdv, 2);

            ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            verify(mailSender).send(captor.capture());
            SimpleMailMessage sent = captor.getValue();

            assertThat(sent.getSubject()).isEqualTo("Rappel : votre rendez-vous dans 2 jours — Doctorek");
            assertThat(sent.getText()).contains("dans 2 jours");
        }

        @Test
        @DisplayName("does not send when disabled")
        void rappelDisabledDoesNotSend() {
            EmailService service = disabledService();

            service.sendRappelRdv("patient@example.com", rdv, 1);

            verify(mailSender, never()).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("does not send when recipient is blank")
        void rappelBlankRecipientDoesNotSend() {
            EmailService service = enabledService();

            service.sendRappelRdv(null, rdv, 1);

            verify(mailSender, never()).send(any(SimpleMailMessage.class));
        }
    }
}
