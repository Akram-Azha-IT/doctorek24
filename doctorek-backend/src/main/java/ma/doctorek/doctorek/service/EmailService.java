package ma.doctorek.doctorek.service;

import jakarta.mail.internet.MimeMessage;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.service.EmailTemplate.Row;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH);
    private static final DateTimeFormatter HOUR_FR = DateTimeFormatter.ofPattern("HH'h'mm", Locale.FRENCH);

    private static final String GREETING = "Bonjour,";
    private static final String LBL_DATE = "Date";
    private static final String LBL_HEURE = "Heure";
    private static final String LBL_DUREE = "Durée";
    private static final String LBL_MOTIF = "Motif";
    private static final String LBL_REF = "Référence";
    private static final String MINUTES = " minutes";

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
        String html = EmailTemplate.shell(
                "Votre code de vérification est " + code,
                "Vérifiez votre adresse email",
                EmailTemplate.p("Bonjour " + EmailTemplate.esc(prenom) + ",")
              + EmailTemplate.p("Voici votre code de vérification pour activer votre compte Doctorek :")
              + EmailTemplate.codeBox(code)
              + EmailTemplate.p("Ce code à usage unique n'est valable que <strong>15 minutes</strong>.")
              + EmailTemplate.divider()
              + EmailTemplate.subheading("Vous n'êtes pas à l'origine de cette demande ?")
              + EmailTemplate.p("Si vous n'avez pas créé de compte Doctorek, ignorez ce message en toute sécurité."));

        String text = """
                Bonjour %s,

                Votre code de vérification Doctorek est : %s
                Ce code est valable 15 minutes.

                Si vous n'avez pas créé de compte Doctorek, ignorez ce message.

                L'équipe Doctorek
                """.formatted(prenom, code);

        send(toEmail, subject, text, html, "verification-code", toEmail);
    }

    @Async
    public void sendBienvenueInscription(String toEmail, String prenom, String role) {
        if (!shouldSend(toEmail)) return;

        String roleLabel = role.equals("MEDECIN") ? "Médecin" : "Patient";
        String subject = "Bienvenue sur Doctorek, votre compte est créé";
        String html = EmailTemplate.shell(
                "Votre compte Doctorek est prêt",
                "Bienvenue sur Doctorek",
                EmailTemplate.p("Bonjour " + EmailTemplate.esc(prenom) + ",")
              + EmailTemplate.p("Votre compte <strong>" + roleLabel + "</strong> a bien été créé. "
                    + "Vous pouvez dès maintenant vous connecter et profiter de la plateforme.")
              + EmailTemplate.note("Besoin d'aide ? Retrouvez le centre d'aide depuis votre espace."));

        String text = """
                Bonjour %s,

                Votre compte Doctorek a bien été créé (%s).
                Vous pouvez dès maintenant vous connecter et utiliser la plateforme.

                L'équipe Doctorek
                """.formatted(prenom, roleLabel);

        send(toEmail, subject, text, html, "bienvenue", toEmail);
    }

    @Async
    public void sendConfirmationRdv(String toEmail, RendezVousEntity rdv) {
        if (!shouldSend(toEmail)) return;

        String subject = "Confirmation de votre rendez-vous | Doctorek";
        String motif = motifOf(rdv);
        String html = EmailTemplate.shell(
                "Votre rendez-vous du " + DATE_FR.format(rdv.getDateRdv()) + " est enregistré",
                "Votre rendez-vous est enregistré",
                EmailTemplate.p(GREETING)
              + EmailTemplate.p("Nous confirmons l'enregistrement de votre rendez-vous.")
              + EmailTemplate.details(List.of(
                    new Row(LBL_DATE, DATE_FR.format(rdv.getDateRdv())),
                    new Row(LBL_HEURE, HOUR_FR.format(rdv.getHeureRdv())),
                    new Row(LBL_DUREE, rdv.getDuree() + MINUTES),
                    new Row(LBL_MOTIF, motif),
                    new Row(LBL_REF, rdv.getId().toString())))
              + EmailTemplate.note("Vous pouvez gérer ou annuler ce rendez-vous depuis votre espace patient."));

        String text = """
                Bonjour,

                Votre rendez-vous est bien enregistré.
                Date : %s
                Heure : %s
                Durée : %d minutes
                Motif : %s
                Référence : %s

                Vous pouvez gérer ou annuler votre rendez-vous depuis votre espace patient.

                L'équipe Doctorek
                """.formatted(DATE_FR.format(rdv.getDateRdv()), HOUR_FR.format(rdv.getHeureRdv()),
                rdv.getDuree(), motif, rdv.getId());

        send(toEmail, subject, text, html, "confirmation", rdv.getId().toString());
    }

    @Async
    public void sendRdvConfirmeParMedecin(String toEmail, RendezVousEntity rdv, String medecinNom) {
        if (!shouldSend(toEmail)) return;

        String subject = "Votre rendez-vous est confirmé | Doctorek";
        String html = EmailTemplate.shell(
                medecinNom + " a confirmé votre rendez-vous",
                "Rendez-vous confirmé",
                EmailTemplate.p(GREETING)
              + EmailTemplate.p("<strong>" + EmailTemplate.esc(medecinNom) + "</strong> a confirmé votre rendez-vous.")
              + EmailTemplate.details(List.of(
                    new Row(LBL_DATE, DATE_FR.format(rdv.getDateRdv())),
                    new Row(LBL_HEURE, HOUR_FR.format(rdv.getHeureRdv())),
                    new Row(LBL_DUREE, rdv.getDuree() + MINUTES),
                    new Row(LBL_REF, rdv.getId().toString())))
              + EmailTemplate.note("À très bientôt sur Doctorek."));

        String text = """
                Bonjour,

                %s a confirmé votre rendez-vous.
                Date : %s
                Heure : %s
                Durée : %d minutes
                Référence : %s

                L'équipe Doctorek
                """.formatted(medecinNom, DATE_FR.format(rdv.getDateRdv()), HOUR_FR.format(rdv.getHeureRdv()),
                rdv.getDuree(), rdv.getId());

        send(toEmail, subject, text, html, "rdv-confirme", rdv.getId().toString());
    }

    @Async
    public void sendRdvCreeParMedecin(String toEmail, RendezVousEntity rdv, String medecinNom, String lienRattachement) {
        if (!shouldSend(toEmail)) return;

        String subject = "Un rendez-vous a été créé pour vous | Doctorek";
        String motif = motifOf(rdv);
        String html = EmailTemplate.shell(
                medecinNom + " a créé un rendez-vous pour vous",
                "Un rendez-vous vous attend",
                EmailTemplate.p(GREETING)
              + EmailTemplate.p("<strong>" + EmailTemplate.esc(medecinNom) + "</strong> a créé un rendez-vous pour vous ou l'un de vos proches.")
              + EmailTemplate.details(List.of(
                    new Row(LBL_DATE, DATE_FR.format(rdv.getDateRdv())),
                    new Row(LBL_HEURE, HOUR_FR.format(rdv.getHeureRdv())),
                    new Row(LBL_MOTIF, motif)))
              + EmailTemplate.p("Rattachez ce rendez-vous à votre compte pour le gérer en famille :")
              + EmailTemplate.button("Rattacher ce rendez-vous", lienRattachement)
              + EmailTemplate.note("Ce lien est valable <strong>30 jours</strong> et ne peut être utilisé qu'une seule fois.")
              + EmailTemplate.note("Si vous n'êtes pas concerné par ce rendez-vous, ignorez cet email."));

        String text = """
                Bonjour,

                %s a créé un rendez-vous pour vous ou votre proche.
                Date : %s
                Heure : %s
                Motif : %s

                Rattachez ce rendez-vous à votre compte :
                %s

                Ce lien est valable 30 jours et ne peut être utilisé qu'une seule fois.
                Si vous n'êtes pas concerné, ignorez cet email.

                L'équipe Doctorek
                """.formatted(medecinNom, DATE_FR.format(rdv.getDateRdv()), HOUR_FR.format(rdv.getHeureRdv()),
                motif, lienRattachement);

        send(toEmail, subject, text, html, "rdv-cree-medecin", rdv.getId().toString());
    }

    @Async
    public void sendRappelRdv30Min(String toEmail, RendezVousEntity rdv, String medecinNom) {
        if (!shouldSend(toEmail)) return;

        String subject = "Rappel : votre rendez-vous dans 30 minutes | Doctorek";
        String html = EmailTemplate.shell(
                "Votre consultation avec " + medecinNom + " commence bientôt",
                "Votre rendez-vous approche",
                EmailTemplate.p(GREETING)
              + EmailTemplate.p("Votre consultation avec <strong>" + EmailTemplate.esc(medecinNom)
                    + "</strong> commence dans <strong>30 minutes</strong>.")
              + EmailTemplate.details(List.of(
                    new Row(LBL_HEURE, HOUR_FR.format(rdv.getHeureRdv())),
                    new Row(LBL_DUREE, rdv.getDuree() + MINUTES)))
              + EmailTemplate.note("Pensez à apporter les documents demandés par votre médecin."));

        String text = """
                Bonjour,

                Votre consultation avec %s commence dans 30 minutes.
                Heure : %s
                Durée : %d minutes

                Pensez à apporter les documents demandés par votre médecin.

                L'équipe Doctorek
                """.formatted(medecinNom, HOUR_FR.format(rdv.getHeureRdv()), rdv.getDuree());

        send(toEmail, subject, text, html, "rappel-30min", rdv.getId().toString());
    }

    @Async
    public void sendRappelRdv(String toEmail, RendezVousEntity rdv, int joursAvant) {
        if (!shouldSend(toEmail)) return;

        String quand = joursAvant == 1 ? "demain" : "dans " + joursAvant + " jours";
        String subject = joursAvant == 1
                ? "Rappel : votre rendez-vous est demain | Doctorek"
                : "Rappel : votre rendez-vous dans " + joursAvant + " jours | Doctorek";
        String motif = motifOf(rdv);
        String html = EmailTemplate.shell(
                "Rappel de votre rendez-vous " + quand,
                "Rappel de rendez-vous",
                EmailTemplate.p(GREETING)
              + EmailTemplate.p("Ceci est un rappel de votre rendez-vous <strong>" + quand + "</strong>.")
              + EmailTemplate.details(List.of(
                    new Row(LBL_DATE, DATE_FR.format(rdv.getDateRdv())),
                    new Row(LBL_HEURE, HOUR_FR.format(rdv.getHeureRdv())),
                    new Row(LBL_DUREE, rdv.getDuree() + MINUTES),
                    new Row(LBL_MOTIF, motif),
                    new Row(LBL_REF, rdv.getId().toString())))
              + EmailTemplate.note("Si vous ne pouvez pas vous présenter, merci d'annuler depuis votre espace patient."));

        String text = """
                Bonjour,

                Ceci est un rappel de votre rendez-vous %s.
                Date : %s
                Heure : %s
                Durée : %d minutes
                Motif : %s
                Référence : %s

                Si vous ne pouvez pas vous présenter, merci d'annuler depuis votre espace patient.

                L'équipe Doctorek
                """.formatted(quand, DATE_FR.format(rdv.getDateRdv()), HOUR_FR.format(rdv.getHeureRdv()),
                rdv.getDuree(), motif, rdv.getId());

        send(toEmail, subject, text, html, "rappel-j-" + joursAvant, rdv.getId().toString());
    }

    @Async
    public void sendCarteAccessOtp(String toEmail, String prenom, String code) {
        if (!shouldSend(toEmail)) return;

        String bonjour = (prenom != null && !prenom.isBlank())
                ? "Bonjour " + EmailTemplate.esc(prenom) + ","
                : GREETING;
        String subject = "Code d'accès à votre carte médicale | Doctorek";
        String html = EmailTemplate.shell(
                "Votre code d'accès aux informations sensibles est " + code,
                "Accès à vos informations sensibles",
                EmailTemplate.p(bonjour)
              + EmailTemplate.p("Un professionnel de santé demande l'accès aux informations "
                    + "sensibles de votre carte médicale (traitements, antécédents, assurance).")
              + EmailTemplate.p("Communiquez-lui ce code uniquement si vous êtes d'accord :")
              + EmailTemplate.codeBox(code)
              + EmailTemplate.p("Ce code à usage unique n'est valable que <strong>5 minutes</strong>.")
              + EmailTemplate.divider()
              + EmailTemplate.subheading("Vous n'êtes pas à l'origine de cette demande ?")
              + EmailTemplate.p("Ne communiquez ce code à personne et ignorez cet email. "
                    + "Vos informations restent protégées."));

        String text = """
                %s

                Un professionnel de santé demande l'accès aux informations sensibles de votre carte medicale.
                Communiquez-lui ce code uniquement si vous etes d'accord : %s
                Ce code est valable 5 minutes.

                Si vous n'etes pas a l'origine de cette demande, ne communiquez ce code a personne.

                L'equipe Doctorek
                """.formatted(bonjour.replace("<strong>", "").replace("</strong>", ""), code);

        send(toEmail, subject, text, html, "carte-access-otp", toEmail);
    }

    private static String motifOf(RendezVousEntity rdv) {
        return rdv.getMotif() == null || rdv.getMotif().isBlank() ? "Non précisé" : rdv.getMotif();
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

    /** Logo de marque embarqué (inline) dans chaque email, référencé par cid dans le HTML. */
    private static final ClassPathResource LOGO = new ClassPathResource("email/logo-doctorek-white.png");

    /** Envoie un email multipart (texte brut + HTML de marque + logo inline) avec bonne délivrabilité. */
    private void send(String to, String subject, String text, String html, String kind, String rdvId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // multipart=true pour permettre l'image inline (contenu related).
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, html); // (plain, html) => multipart/alternative
            if (LOGO.exists()) {
                helper.addInline(EmailTemplate.LOGO_CID, LOGO, "image/png");
            }
            mailSender.send(message);
            log.info("Sent {} email to {} for rdv {}", kind, to, rdvId);
        } catch (Exception ex) {
            log.error("Failed to send {} email to {} for rdv {}", kind, to, rdvId, ex);
        }
    }
}
