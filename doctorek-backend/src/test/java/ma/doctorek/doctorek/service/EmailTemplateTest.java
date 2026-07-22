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
                .contains("L'équipe Doctorek");
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
