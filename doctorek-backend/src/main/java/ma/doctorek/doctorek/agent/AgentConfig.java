package ma.doctorek.doctorek.agent;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.exception.AgentLimiteOutilsException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.execution.ToolExecutionExceptionProcessor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;
/**
 * Câblage du module agent.
 *
 * <h2>Pourquoi une condition</h2>
 * L'autoconfiguration Gemini de Spring AI s'active par défaut dès que le starter
 * est au classpath, et échoue au démarrage si aucune clé API n'est fournie. Sur
 * une application déjà en production, cela transformerait une variable
 * d'environnement oubliée en indisponibilité totale.
 *
 * <p>D'où le commutateur unique {@code spring.ai.model.chat}, positionné à
 * {@code none} par défaut dans {@code application.properties} : sans lui,
 * l'autoconfiguration ne se déclenche pas, ce module non plus, et le reste de
 * l'application démarre normalement. L'activation se fait en posant
 * {@code SPRING_AI_MODEL_CHAT=google-genai} et {@code GEMINI_API_KEY} ensemble.
 */
@Configuration
@ConditionalOnProperty(name = "spring.ai.model.chat", havingValue = "google-genai")
public class AgentConfig {

    @Bean
    public AgentModelClient agentModelClient(ChatClient.Builder builder,
                                             AgentTools outils,
                                             ZoneId zoneApplication) {
        return new SpringAiAgentModelClient(builder, outils, zoneApplication);
    }

    /**
     * Traitement des erreurs d'outil.
     *
     * <p>Gemini exige que chaque résultat d'outil soit un objet JSON. Le processeur
     * Spring AI par défaut renvoie uniquement le message de l'exception, donc une
     * phrase brute. Le connecteur Google essaie ensuite de parser cette phrase comme
     * du JSON et échoue avant que le modèle puisse se corriger.
     *
     * <p>Les erreurs métier récupérables sont donc renvoyées sous la forme
     * {@code {"success":false,"tool":"...","message":"..."}}. Le modèle peut
     * alors demander une ville, proposer d'activer la géolocalisation ou corriger
     * ses paramètres sans faire tomber tout le tour.
     *
     * <p>Une exception à cette règle : le dépassement du plafond d'outils doit
     * interrompre le tour. Le renvoyer au modèle l'inviterait à retenter, soit
     * exactement la boucle que le plafond existe pour couper.
     */
    @Bean
    public ToolExecutionExceptionProcessor toolExecutionExceptionProcessor(ObjectMapper objectMapper) {
        return exception -> {
            Throwable cause = exception.getCause();
            if (cause instanceof AgentLimiteOutilsException limite) {
                throw limite;
            }
            if (!(cause instanceof RuntimeException)) {
                throw exception;
            }

            String message = cause.getMessage();
            if (message == null || message.isBlank()) {
                message = "L'outil n'a pas pu terminer la demande.";
            }

            ToolErrorResponse erreur = new ToolErrorResponse(
                    false,
                    exception.getToolDefinition().name(),
                    message);
            try {
                return objectMapper.writeValueAsString(erreur);
            } catch (JsonProcessingException serializationException) {
                throw new IllegalStateException(
                        "Impossible de sérialiser l'erreur de l'outil en JSON",
                        serializationException);
            }
        };
    }

    private record ToolErrorResponse(boolean success, String tool, String message) {
    }
}
