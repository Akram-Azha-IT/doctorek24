package ma.doctorek.doctorek.service;

import java.util.List;

/**
 * Gabarit d'email HTML de marque Doctorek.
 *
 * Layout : canevas clair, mot-symbole HTML, carte blanche centrée, contenu aéré
 * et pied de page marine rassurant.
 * Contraintes clients email : mise en page par tableaux, CSS en ligne, largeur 600px,
 * polices web-safe, boutons "bulletproof".
 */
public final class EmailTemplate {

    private EmailTemplate() {}

    private static final String BLUE      = "#007DFF";
    private static final String NAVY      = "#00263C";
    private static final String BODY      = "#55606B";
    private static final String HEAD      = "#2B3440";
    private static final String MUTED     = "#6B7684";
    private static final String LINE      = "#E7ECF2";
    private static final String FONT      = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

    public record Row(String label, String value) {}

    private static String wordmark(String color, String accent) {
        return "<span style=\"font-family:Georgia,'Times New Roman',serif;font-size:42px;"
             + "font-weight:700;font-style:italic;letter-spacing:-2px;color:" + color + ";\">Doctor"
             + "<span style=\"color:" + accent + ";\">ek</span></span>";
    }

    /** Échappe le HTML d'un contenu utilisateur (nom, motif...) avant injection. */
    public static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    /** Paragraphe de corps. */
    public static String p(String htmlContent) {
        return "<p style=\"margin:0 0 16px;font-size:15px;line-height:1.7;color:" + BODY + ";\">" + htmlContent + "</p>";
    }

    /** Sous-titre en gras (ex. "Vous n'êtes pas à l'origine de cette demande ?"). */
    public static String subheading(String text) {
        return "<p style=\"margin:22px 0 6px;font-size:15px;font-weight:700;color:" + HEAD + ";\">" + esc(text) + "</p>";
    }

    /** Filet fin de séparation. */
    public static String divider() {
        return "<div style=\"height:1px;background:" + LINE + ";margin:22px 0;\"></div>";
    }

    /** Liste de détails alignée sur le langage agenda-first. */
    public static String details(List<Row> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
          .append("style=\"margin:6px 0 22px;\">");
        for (int i = 0; i < rows.size(); i++) {
            Row r = rows.get(i);
            sb.append("<tr>")
              .append("<td style=\"padding:13px 0;border-top:1px solid ").append(LINE)
              .append(";font-size:13px;font-weight:700;color:").append(HEAD)
              .append(";width:38%;vertical-align:top;\">")
              .append(esc(r.label())).append("</td>")
              .append("<td style=\"padding:13px 0;border-top:1px solid ").append(LINE)
              .append(";font-size:14px;color:").append(BODY)
              .append(";text-align:right;word-break:break-word;\">")
              .append(esc(r.value())).append("</td>")
              .append("</tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }

    /** Bouton d'action principal (un seul par email). */
    public static String button(String label, String url) {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:6px auto 22px;\"><tr>"
             + "<td align=\"center\" style=\"border:2px solid " + BLUE + ";border-radius:8px;\">"
             + "<a href=\"" + esc(url) + "\" target=\"_blank\" style=\"display:inline-block;padding:14px 30px;"
             + "font-family:" + FONT + ";font-size:15px;font-weight:700;color:" + BLUE + ";text-decoration:none;border-radius:8px;\">"
             + esc(label) + "</a></td></tr></table>";
    }

    /** Bloc de code de vérification, mis en avant (fond gris clair, chiffres espacés). */
    public static String codeBox(String code) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:6px 0 22px;\"><tr>"
             + "<td align=\"center\" style=\"background:#EBF5FF;border:1px solid #C9E3FA;border-radius:12px;padding:26px 20px;\">"
             + "<div style=\"font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:12px;color:" + NAVY + ";\">"
             + esc(code) + "</div></td></tr></table>";
    }

    /** Encart informatif discret (sécurité, validité...). */
    public static String note(String htmlContent) {
        return "<p style=\"margin:0 0 8px;font-size:13.5px;line-height:1.7;color:" + MUTED + ";\">" + htmlContent + "</p>";
    }

    /**
     * Confirmation de rendez-vous "agenda-first". Aucun asset distant ou CID :
     * le rendu est immédiat et ne crée pas de pièce jointe inline dans Gmail.
     */
    public static String confirmationRdv(
            String preheader,
            String weekday,
            String day,
            String month,
            String fullDate,
            String time,
            String motif,
            String reference,
            String calendarUrl,
            String manageUrl) {
        String safeCalendarUrl = esc(calendarUrl);
        String safeManageUrl = esc(manageUrl);

        return "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<meta name=\"color-scheme\" content=\"light\">"
            + "<title>Votre rendez-vous est enregistré</title>"
            + "<style>@media only screen and (max-width:620px){.email-shell{width:100%!important;}"
            + ".page-pad{padding:12px!important;}.content-pad{padding-left:22px!important;padding-right:22px!important;}"
            + ".ticket-pad{padding:22px 16px!important;}.ticket-date{width:34%!important;}"
            + ".ticket-time{font-size:48px!important;}.wordmark{font-size:36px!important;}}</style></head>"
            + "<body style=\"margin:0;padding:0;background:#F3F6FA;font-family:" + FONT + ";\">"
            + "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">" + esc(preheader) + "</div>"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#F3F6FA;\">"
            + "<tr><td class=\"page-pad\" align=\"center\" style=\"padding:28px 14px;\">"
            + "<table role=\"presentation\" class=\"email-shell\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" "
            + "style=\"width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;"
            + "box-shadow:0 8px 28px rgba(0,38,60,.08);\">"

            // En-tête sans image : mot-symbole HTML + statut.
            + "<tr><td align=\"center\" style=\"padding:30px 24px 22px;\">"
            + "<div class=\"wordmark\" style=\"line-height:1;\">" + wordmark(NAVY, BLUE) + "</div>"
            + "<div style=\"margin-top:14px;font-size:14px;font-weight:800;letter-spacing:.08em;color:"
            + "#259C65;\">CONFIRMÉ</div></td></tr>"

            // Ticket calendrier : la date et l'heure dominent la lecture.
            + "<tr><td class=\"content-pad\" style=\"padding:0 32px;\">"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
            + "style=\"background:" + BLUE + ";border-radius:16px;\"><tr>"
            + "<td class=\"ticket-pad ticket-date\" width=\"34%\" align=\"center\" style=\"padding:24px 18px;"
            + "border-right:1px solid rgba(255,255,255,.42);\">"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
            + "style=\"background:#ffffff;border-radius:12px;\"><tr><td align=\"center\" style=\"padding:16px 8px;\">"
            + "<div style=\"font-size:16px;font-weight:800;letter-spacing:.08em;color:" + BLUE + ";\">" + esc(weekday) + "</div>"
            + "<div style=\"margin:4px 0;font-size:48px;line-height:1;font-weight:800;color:" + NAVY + ";\">" + esc(day) + "</div>"
            + "<div style=\"font-size:16px;font-weight:800;color:" + BLUE + ";\">" + esc(month) + "</div>"
            + "</td></tr></table></td>"
            + "<td class=\"ticket-pad\" align=\"center\" style=\"padding:24px 18px;color:#ffffff;\">"
            + "<div style=\"font-size:15px;font-weight:700;line-height:1.4;\">" + esc(fullDate) + "</div>"
            + "<div class=\"ticket-time\" style=\"margin:6px 0 0;font-size:58px;line-height:1;font-weight:800;letter-spacing:-2px;\">"
            + esc(time) + "</div>"
            + "</td></tr></table></td></tr>"

            // Confirmation et métadonnées.
            + "<tr><td class=\"content-pad\" style=\"padding:30px 40px 8px;\">"
            + "<h1 style=\"margin:0 0 10px;font-size:24px;line-height:1.35;font-weight:800;color:" + NAVY + ";\">"
            + "Votre rendez-vous est enregistré</h1>"
            + "<p style=\"margin:0 0 22px;font-size:15px;line-height:1.65;color:" + BODY + ";\">"
            + "Nous confirmons l'enregistrement de votre rendez-vous.</p>"
            + confirmationRow("Motif", motif, false)
            + confirmationRow("Date", fullDate, false)
            + confirmationRow("Heure", time, false)
            + confirmationRow("Référence", reference, true)
            + "</td></tr>"

            // Actions compatibles avec les clients email.
            + "<tr><td align=\"center\" class=\"content-pad\" style=\"padding:20px 40px 30px;\">"
            + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\"><tr>"
            + "<td align=\"center\" style=\"border:2px solid " + BLUE + ";border-radius:8px;\">"
            + "<a href=\"" + safeCalendarUrl + "\" target=\"_blank\" style=\"display:inline-block;padding:13px 28px;"
            + "font-size:15px;font-weight:700;color:" + BLUE + ";text-decoration:none;\">Ajouter à mon agenda</a>"
            + "</td></tr></table>"
            + "<p style=\"margin:18px 0 0;font-size:14px;font-weight:700;\">"
            + "<a href=\"" + safeManageUrl + "\" target=\"_blank\" style=\"color:" + BLUE + ";text-decoration:none;\">"
            + "Gérer ou annuler le rendez-vous</a></p></td></tr>"

            // Pied de page sombre et rassurant.
            + "<tr><td class=\"content-pad\" style=\"background:" + NAVY + ";padding:26px 40px 24px;\">"
            + "<p style=\"margin:0 0 8px;font-size:15px;font-weight:700;color:#ffffff;\">Besoin d'aide ?</p>"
            + "<p style=\"margin:0 0 18px;font-size:13px;line-height:1.6;color:#C6D9E8;\">"
            + "Consultez la rubrique Aide depuis votre espace Doctorek.</p>"
            + "<div style=\"height:1px;background:#416274;margin:0 0 18px;\"></div>"
            + "<p style=\"margin:0 0 5px;font-size:14px;font-weight:700;color:#ffffff;\">"
            + "Vos données sont sécurisées et confidentielles.</p>"
            + "<p style=\"margin:0 0 20px;font-size:13px;line-height:1.6;color:#C6D9E8;\">"
            + "Doctorek respecte la confidentialité de vos informations de santé.</p>"
            + "<div style=\"height:1px;background:#416274;margin:0 0 18px;\"></div>"
            + "<p style=\"margin:0 0 4px;text-align:center;font-size:11px;line-height:1.6;color:#AFC5D4;\">"
            + "Ceci est un message automatique, merci de ne pas y répondre.</p>"
            + "<p style=\"margin:0;text-align:center;font-size:11px;line-height:1.6;color:#AFC5D4;\">"
            + "Doctorek, prise de rendez-vous et suivi médical au Maroc.</p>"
            + "</td></tr></table></td></tr></table></body></html>";
    }

    private static String confirmationRow(String label, String value, boolean breakAll) {
        String wrapping = breakAll ? "word-break:break-all;" : "";
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
             + "style=\"border-top:1px solid " + LINE + ";\"><tr>"
             + "<td width=\"36%\" style=\"padding:13px 0;font-size:13px;font-weight:700;color:" + HEAD + ";\">"
             + esc(label) + "</td>"
             + "<td align=\"right\" style=\"padding:13px 0;font-size:14px;color:" + BODY + ";" + wrapping + "\">"
             + esc(value) + "</td></tr></table>";
    }

    /**
     * Assemble le document HTML partagé par les emails de bienvenue, sécurité,
     * rappel et notification.
     * @param preheader texte d'aperçu (masqué, visible dans la liste des mails)
     * @param title titre en tête de la carte (bleu)
     * @param inner HTML du contenu
     */
    public static String shell(String preheader, String title, String inner) {
        return "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<meta name=\"color-scheme\" content=\"light\">"
            + "<title>" + esc(title) + "</title>"
            + "<style>@media only screen and (max-width:600px){.email-shell{width:100%!important;}"
            + ".page-pad{padding:12px!important;}.content-pad{padding-left:22px!important;padding-right:22px!important;}}</style></head>"
            + "<body style=\"margin:0;padding:0;background:#F3F6FA;font-family:" + FONT + ";\">"
            + "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">" + esc(preheader) + "</div>"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#F3F6FA;\">"
            + "<tr><td class=\"page-pad\" align=\"center\" style=\"padding:28px 14px;\">"
            + "<table role=\"presentation\" class=\"email-shell\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" "
            + "style=\"width:560px;max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;"
            + "box-shadow:0 8px 28px rgba(0,38,60,.08);\">"

            // En-tête commun sans image ni pièce jointe CID.
            + "<tr><td align=\"center\" style=\"padding:30px 24px 22px;\">"
            + wordmark(NAVY, BLUE)
            + "<div style=\"margin-top:14px;font-size:12px;font-weight:800;letter-spacing:.1em;color:"
            + BLUE + ";\">MESSAGE DOCTOREK</div></td></tr>"

            // Contenu propre au message.
            + "<tr><td class=\"content-pad\" style=\"padding:18px 40px 28px;\">"
            + "<h1 style=\"margin:0 0 20px;font-size:24px;font-weight:800;color:" + NAVY + ";line-height:1.35;\">" + esc(title) + "</h1>"
            + inner
            + "<p style=\"margin:22px 0 8px;font-size:15px;line-height:1.6;color:" + BODY + ";\">Prenez soin de vous,<br>"
            + "<strong style=\"color:" + NAVY + ";\">L'équipe Doctorek</strong></p>"
            + "</td></tr>"

            // Pied de page commun, identique à la confirmation.
            + "<tr><td class=\"content-pad\" style=\"background:" + NAVY + ";padding:26px 40px 24px;\">"
            + "<p style=\"margin:0 0 8px;font-size:15px;font-weight:700;color:#ffffff;\">Besoin d'aide ?</p>"
            + "<p style=\"margin:0 0 18px;font-size:13px;line-height:1.6;color:#C6D9E8;\">"
            + "Consultez la rubrique Aide depuis votre espace Doctorek.</p>"
            + "<div style=\"height:1px;background:#416274;margin:0 0 18px;\"></div>"
            + "<p style=\"margin:0 0 5px;font-size:14px;font-weight:700;color:#ffffff;\">"
            + "Vos données sont sécurisées et confidentielles.</p>"
            + "<p style=\"margin:0 0 20px;font-size:13px;line-height:1.6;color:#C6D9E8;\">"
            + "Doctorek respecte la confidentialité de vos informations de santé.</p>"
            + "<div style=\"height:1px;background:#416274;margin:0 0 18px;\"></div>"
            + "<p style=\"margin:0 0 4px;text-align:center;font-size:11px;line-height:1.6;color:#AFC5D4;\">"
            + "Ceci est un message automatique, merci de ne pas y répondre.</p>"
            + "<p style=\"margin:0;text-align:center;font-size:11px;line-height:1.6;color:#AFC5D4;\">"
            + "Doctorek, prise de rendez-vous et suivi médical au Maroc.</p>"
            + "</td></tr>"

            + "</table></td></tr></table></body></html>";
    }
}
