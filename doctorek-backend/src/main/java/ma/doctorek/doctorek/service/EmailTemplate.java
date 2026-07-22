package ma.doctorek.doctorek.service;

import java.util.List;

/**
 * Gabarit d'email HTML de marque Doctorek (style inspiré de Doctolib).
 *
 * Layout : fond bleu de marque, logo blanc en tête, carte blanche arrondie centrée,
 * contenu aéré, barre de pied sombre "Besoin d'aide ?". Le logo réel est embarqué en
 * pièce jointe inline (cid:logo) par EmailService.
 * Contraintes clients email : mise en page par tableaux, CSS en ligne, largeur 600px,
 * polices web-safe, boutons "bulletproof".
 */
public final class EmailTemplate {

    private EmailTemplate() {}

    /** Identifiant de la pièce jointe inline du logo (posé par EmailService via addInline). */
    public static final String LOGO_CID = "doctorek-logo";

    private static final String BLUE      = "#007DFF";
    private static final String BODY      = "#55606B";
    private static final String HEAD      = "#2B3440";
    private static final String MUTED     = "#6B7684";
    private static final String LINE      = "#E7ECF2";
    private static final String SOFT      = "#EEF2F6";
    private static final String CODE_INK  = "#37474F";
    private static final String FOOTER_BG = "#3D4E5E";
    private static final String GOLD      = "#ECB22E";
    private static final String FONT      = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

    public record Row(String label, String value) {}

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

    /** Carte de détails (libellé / valeur), lignes régulièrement espacées. */
    public static String details(List<Row> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"")
          .append("background:").append(SOFT).append(";border-radius:12px;margin:4px 0 22px;\">");
        sb.append("<tr><td style=\"padding:6px 20px;\">");
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">");
        for (int i = 0; i < rows.size(); i++) {
            Row r = rows.get(i);
            String border = i < rows.size() - 1 ? "border-bottom:1px solid #E1E7EE;" : "";
            sb.append("<tr>")
              .append("<td style=\"padding:12px 0;").append(border)
              .append("font-size:13px;color:").append(MUTED).append(";width:40%;vertical-align:top;\">")
              .append(esc(r.label())).append("</td>")
              .append("<td style=\"padding:12px 0;").append(border)
              .append("font-size:15px;font-weight:600;color:").append(HEAD).append(";text-align:right;\">")
              .append(esc(r.value())).append("</td>")
              .append("</tr>");
        }
        sb.append("</table></td></tr></table>");
        return sb.toString();
    }

    /** Bouton d'action principal (un seul par email). */
    public static String button(String label, String url) {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:6px auto 22px;\"><tr>"
             + "<td align=\"center\" bgcolor=\"" + BLUE + "\" style=\"border-radius:8px;\">"
             + "<a href=\"" + esc(url) + "\" target=\"_blank\" style=\"display:inline-block;padding:14px 30px;"
             + "font-family:" + FONT + ";font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;\">"
             + esc(label) + "</a></td></tr></table>";
    }

    /** Bloc de code de vérification, mis en avant (fond gris clair, chiffres espacés). */
    public static String codeBox(String code) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:6px 0 22px;\"><tr>"
             + "<td align=\"center\" style=\"background:" + SOFT + ";border-radius:8px;padding:26px 20px;\">"
             + "<div style=\"font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:12px;color:" + CODE_INK + ";\">"
             + esc(code) + "</div></td></tr></table>";
    }

    /** Encart informatif discret (sécurité, validité...). */
    public static String note(String htmlContent) {
        return "<p style=\"margin:0 0 8px;font-size:13.5px;line-height:1.7;color:" + MUTED + ";\">" + htmlContent + "</p>";
    }

    /**
     * Assemble le document HTML complet : fond bleu, logo blanc, carte blanche arrondie, pied sombre.
     * @param preheader texte d'aperçu (masqué, visible dans la liste des mails)
     * @param title titre en tête de la carte (bleu)
     * @param inner HTML du contenu
     */
    public static String shell(String preheader, String title, String inner) {
        return "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<meta name=\"color-scheme\" content=\"light\">"
            + "<title>" + esc(title) + "</title></head>"
            + "<body style=\"margin:0;padding:0;background:" + BLUE + ";font-family:" + FONT + ";\">"
            + "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">" + esc(preheader) + "</div>"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:" + BLUE + ";\">"
            + "<tr><td align=\"center\" style=\"padding:12px 14px 34px;\">"
            + "<table role=\"presentation\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:560px;max-width:560px;\">"

            // Logo blanc, centré sur le bleu
            + "<tr><td align=\"center\" style=\"padding:30px 20px 26px;\">"
            + "<img src=\"cid:" + LOGO_CID + "\" alt=\"Doctorek\" width=\"178\" "
            + "style=\"display:block;border:0;outline:none;width:178px;height:auto;\"></td></tr>"

            // Carte blanche, coins supérieurs arrondis
            + "<tr><td style=\"background:#ffffff;border-radius:18px 18px 0 0;padding:34px 40px 10px;\">"
            + "<h1 style=\"margin:0 0 20px;font-size:21px;font-weight:700;color:" + BLUE + ";line-height:1.35;\">" + esc(title) + "</h1>"
            + inner
            + "<p style=\"margin:22px 0 8px;font-size:15px;line-height:1.6;color:" + BODY + ";\">Prenez soin de vous,<br>"
            + "<strong style=\"color:" + HEAD + ";\">L'équipe Doctorek</strong></p>"
            + "</td></tr>"

            // Barre de pied sombre, coins inférieurs arrondis
            + "<tr><td align=\"center\" style=\"background:" + FOOTER_BG + ";border-radius:0 0 18px 18px;padding:20px;\">"
            + "<span style=\"font-size:15px;font-weight:700;color:" + GOLD + ";\">Besoin d'aide ?</span>"
            + "<span style=\"font-size:13px;color:#C6D0D9;\">&nbsp;&nbsp;Rubrique Aide de votre espace Doctorek</span>"
            + "</td></tr>"

            // Mentions sous la carte, sur le bleu
            + "<tr><td align=\"center\" style=\"padding:22px 20px 4px;\">"
            + "<p style=\"margin:0 0 4px;font-size:12px;line-height:1.6;color:#DCEBFF;\">"
            + "Ceci est un message automatique, merci de ne pas y répondre.</p>"
            + "<p style=\"margin:0;font-size:12px;line-height:1.6;color:#B9D8FF;\">"
            + "Doctorek, prise de rendez-vous et suivi médical au Maroc.</p>"
            + "</td></tr>"

            + "</table></td></tr></table></body></html>";
    }
}
