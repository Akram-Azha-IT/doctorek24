package ma.doctorek.doctorek.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.exception.AgentLimiteOutilsException;
import org.junit.jupiter.api.Test;
import org.springframework.ai.tool.definition.ToolDefinition;
import org.springframework.ai.tool.execution.ToolExecutionException;
import org.springframework.ai.tool.execution.ToolExecutionExceptionProcessor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AgentConfigTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ToolExecutionExceptionProcessor processor =
            new AgentConfig().toolExecutionExceptionProcessor(objectMapper);

    @Test
    void erreurRecuperable_estUnObjetJsonCompatibleGemini() throws Exception {
        ToolExecutionException exception = new ToolExecutionException(
                definition("medecins_a_proximite"),
                new IllegalStateException(
                        "La position du patient n'est pas disponible. Précisez une ville."));

        JsonNode resultat = objectMapper.readTree(processor.process(exception));

        assertThat(resultat.isObject()).isTrue();
        assertThat(resultat.path("success").asBoolean()).isFalse();
        assertThat(resultat.path("tool").asText()).isEqualTo("medecins_a_proximite");
        assertThat(resultat.path("message").asText()).contains("position du patient");
    }

    @Test
    void limiteOutils_interromptToujoursLeTour() {
        AgentLimiteOutilsException limite = new AgentLimiteOutilsException(6);
        ToolExecutionException exception = new ToolExecutionException(
                definition("rechercher_medecins"),
                limite);

        assertThatThrownBy(() -> processor.process(exception))
                .isSameAs(limite);
    }

    private ToolDefinition definition(String nom) {
        return ToolDefinition.builder()
                .name(nom)
                .description("Outil de test")
                .inputSchema("{}")
                .build();
    }
}
