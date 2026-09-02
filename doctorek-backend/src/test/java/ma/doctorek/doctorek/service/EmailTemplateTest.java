package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.service.EmailTemplate.Row;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmailTemplateTest {

    @Test
    @DisplayName("esc neutralise le HTML injecté (anti-XSS dans l'email)")
    void esc_escapesHtml() {
        assertThat(EmailTemplate.esc("<script>alert(1)</script>"))
                .isEqualTo("&lt;script&gt;alert(1)&lt;/script&gt;");
        assertThat(EmailTemplate.esc(null)).isEmpty();
    }

    @Test
    @DisplayName("shell produit un document de marque avec titre et pré-en-tête")
    void shell_containsBrandAndTitle() {
        String html = EmailTemplate.shell("aperçu", "Mon titre", EmailTemplate.p("corps"));
        assertThat(html)
                .contains("<!DOCTYPE html>")
                .contains("Doctorek")
                .contains("Mon titre")
                .contains("aperçu")
                .contains("L'équipe Doctorek")
                .contains("background:#F3F6FA")
                .contains("background:#00263C")
                .contains("Vos données sont sécurisées et confidentielles")
                .doesNotContain("<img")
                .doesNotContain("cid:");
    }

    @Test
    @DisplayName("le shell partagé unifie bienvenue, codes et notifications")
    void shell_unifiesAllTransactionalMessages() {
        String html = EmailTemplate.shell(
                "Votre compte Doctorek est prêt",
                "Bienvenue sur Doctorek",
                EmailTemplate.p("Votre compte est créé.")
              + EmailTemplate.codeBox("123456")
              + EmailTemplate.details(List.of(new Row("Statut", "Actif")))
              + EmailTemplate.button("Ouvrir mon espace", "https://doctorek.ma/dashboard/patient"));

        assertThat(html)
                .contains("Bienvenue sur Doctorek")
                .contains("123456")
                .contains("Statut")
                .contains("Ouvrir mon espace")
                .contains("Besoin d'aide ?")
                .contains("Ceci est un message automatique")
                .doesNotContain("<img")
                .doesNotContain("cid:");
    }

    @Test
    @DisplayName("confirmationRdv reprend la hiérarchie agenda-first sans image")
    void confirmationRdv_containsCalendarFirstLayoutWithoutImage() {
        String html = EmailTemplate.confirmationRdv(
                "Votre rendez-vous du vendredi 28 août 2026 est enregistré",
                "VEN",
                "28",
                "AOÛT",
                "vendredi 28 août 2026",
                "09h00",
                "test",
                "dc7adaab-cc6d-4c39-b1ba-4dbd9323f92f",
                "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Rendez-vous+Doctorek",
                "https://doctorek.ma/dashboard/patient/rdvs");

        assertThat(html)
                .contains("CONFIRMÉ")
                .contains("VEN")
                .contains(">28<")
                .contains("AOÛT")
                .contains("09h00")
                .contains("Ajouter à mon agenda")
                .contains("Gérer ou annuler le rendez-vous")
                .contains("https://calendar.google.com/calendar/render?action=TEMPLATE&amp;text=Rendez-vous+Doctorek")
                .contains("https://doctorek.ma/dashboard/patient/rdvs")
                .doesNotContain("30 minutes")
                .doesNotContain("Durée")
                .doesNotContain("<img")
                .doesNotContain("cid:");
    }

    @Test
    @DisplayName("aucun tiret cadratin dans le rendu")
    void shell_hasNoEmDash() {
        String html = EmailTemplate.shell("x", "y",
                EmailTemplate.details(List.of(new Row("Date", "demain")))
              + EmailTemplate.button("Ouvrir", "https://app.example/x")
              + EmailTemplate.codeBox("123456"));
        assertThat(html).doesNotContain("—");
    }

    @Test
    @DisplayName("details échappe les valeurs utilisateur")
    void details_escapesValues() {
        String html = EmailTemplate.details(List.of(new Row("Motif", "<b>x</b>")));
        assertThat(html)
                .contains("&lt;b&gt;x&lt;/b&gt;")
                .doesNotContain("<b>x</b>");
    }
}
