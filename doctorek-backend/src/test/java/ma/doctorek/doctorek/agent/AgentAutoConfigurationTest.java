package ma.doctorek.doctorek.agent;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.model.google.genai.autoconfigure.chat.GoogleGenAiChatAutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.util.ClassUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Garde-fou de démarrage.
 *
 * <p>L'application est déjà en production : brancher un module d'IA ne doit pas
 * pouvoir la rendre indisponible. Le starter Gemini apporte des autoconfigurations
 * qui s'activent par défaut et échouent quand la configuration est incomplète.
 * Ces tests figent les deux propriétés qui neutralisent ce risque.
 */
class AgentAutoConfigurationTest {

    @Test
    @DisplayName("chat : sans spring.ai.model.chat=google-genai, aucun modèle n'est créé")
    void chat_desactive_neCreeAucunModele() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(GoogleGenAiChatAutoConfiguration.class))
                .withPropertyValues("spring.ai.model.chat=none")
                .run(contexte -> {
                    assertThat(contexte).hasNotFailed();
                    assertThat(contexte).doesNotHaveBean(GoogleGenAiChatModel.class);
                });
    }

    @Test
    @DisplayName("embedding : l'artefact n'est pas au classpath, ses autoconfigurations restent inertes")
    void embedding_absentDuClasspath_resteInerte() {
        // Sa configuration de connexion s'active sans condition de propriété et exige
        // un project-id dès qu'aucune clé n'est fournie : elle ferait échouer le
        // démarrage si l'artefact était tiré. Seule sa @ConditionalOnClass l'en empêche.
        boolean present = ClassUtils.isPresent(
                "org.springframework.ai.google.genai.GoogleGenAiEmbeddingConnectionDetails",
                getClass().getClassLoader());

        assertThat(present)
                .as("ne pas ajouter spring-ai-google-genai-embedding sans configurer une clé embedding")
                .isFalse();
    }

    @Test
    @DisplayName("le module agent n'est pas câblé quand aucun modèle n'est configuré")
    void moduleAgent_desactive_sansModele() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(GoogleGenAiChatAutoConfiguration.class))
                .withUserConfiguration(AgentConfig.class)
                .withPropertyValues("spring.ai.model.chat=none")
                .run(contexte -> {
                    assertThat(contexte).hasNotFailed();
                    assertThat(contexte).doesNotHaveBean(AgentModelClient.class);
                });
    }
}
