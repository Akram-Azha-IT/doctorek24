package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH);
    private static final DateTimeFormatter HOUR_FR = DateTimeFormatter.ofPattern("HH'h'mm", Locale.FRENCH);

    private final JavaMailSender mailSender;
    private final String from;
    private final boolean enabled;

    public EmailService(JavaMailSender mailSender,
            @Value("${doctorek.mail.from}") String from,
            @Value("${doctorek.mail.enabled:true}") boolean enabled) {
        this.mailSender = mailSender;
        this.from = from;
        this.enabled = enabled;
    }

    @Async
    public void sendVerificationCode(String toEmail, String prenom, String code) {
        if (!shouldSend(toEmail)) return;

        String subject = "Votre code de vérification Doctorek";
        String body = """
                Bonjour %s,

                Votre code de vérification est :

                    %s

                Ce code est valable 15 minutes.

                Si vous n'avez pas créé de compte Doctorek, ignorez ce message.

                — L'équipe Doctorek
                """.formatted(prenom, code);

        send(toEmail, subject, body, "verification-code", toEmail);
    }

    @Async
    public void sendBienvenueInscription(String toEmail, String prenom, String role) {
        if (!shouldSend(toEmail)) return;

        String subject = "Bienvenue sur Doctorek ! votre compte a été créé";
        String body = """
                Bonjour %s,

                Votre compte Doctorek a bien été créé (%s).

                Vous pouvez dès maintenant vous connecter et utiliser la plateforme.

                — L'équipe Doctorek
                """.formatted(prenom, role.equals("MEDECIN") ? "Médecin" : "Patient");

        send(toEmail, subject, body, "bienvenue", toEmail);
    }

    @Async
    public void sendConfirmationRdv(String toEmail, RendezVousEntity rdv) {
        if (!shouldSend(toEmail)) return;

        String subject = "Confirmation de votre rendez-vous — Doctorek";
        String body = """
                Bonjour,

                Votre rendez-vous est bien enregistré.

                Date : %s
                Heure : %s
                Durée : %d minutes
                Motif : %s

                Référence : %s

                Vous pouvez gérer ou annuler votre rendez-vous depuis votre espace patient.

                — L'équipe Doctorek
                """.formatted(
                DATE_FR.format(rdv.getDateRdv()),
                HOUR_FR.format(rdv.getHeureRdv()),
                rdv.getDuree(),
                rdv.getMotif() == null || rdv.getMotif().isBlank() ? "Non précisé" : rdv.getMotif(),
                rdv.getId());

        send(toEmail, subject, body, "confirmation", rdv.getId().toString());
    }

    @Async
    public void sendRappelRdv(String toEmail, RendezVousEntity rdv, int joursAvant) {
        if (!shouldSend(toEmail)) return;

        String subject = joursAvant == 1
                ? "Rappel : votre rendez-vous est demain — Doctorek"
                : "Rappel : votre rendez-vous dans " + joursAvant + " jours — Doctorek";

        String body = """
                Bonjour,

                Ceci est un rappel de votre rendez-vous %s.

                Date : %s
                Heure : %s
                Durée : %d minutes
                Motif : %s

                Référence : %s

                Si vous ne pouvez pas vous présenter, merci d'annuler depuis votre espace patient.

                — L'équipe Doctorek
                """.formatted(
                joursAvant == 1 ? "de demain" : "dans " + joursAvant + " jours",
                DATE_FR.format(rdv.getDateRdv()),
                HOUR_FR.format(rdv.getHeureRdv()),
                rdv.getDuree(),
                rdv.getMotif() == null || rdv.getMotif().isBlank() ? "Non précisé" : rdv.getMotif(),
                rdv.getId());

        send(toEmail, subject, body, "rappel-j-" + joursAvant, rdv.getId().toString());
    }

    private boolean shouldSend(String toEmail) {
        if (!enabled) {
            log.debug("Mail disabled (doctorek.mail.enabled=false), skipping send to {}", toEmail);
            return false;
        }
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send email: recipient address is blank");
            return false;
        }
        return true;
    }

    private void send(String to, String subject, String body, String kind, String rdvId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
            log.info("Sent {} email to {} for rdv {}", kind, to, rdvId);
        } catch (Exception ex) {
            log.error("Failed to send {} email to {} for rdv {}", kind, to, rdvId, ex);
        }
    }
}
