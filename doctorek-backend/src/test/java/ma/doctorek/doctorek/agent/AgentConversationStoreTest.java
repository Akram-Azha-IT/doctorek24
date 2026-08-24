package ma.doctorek.doctorek.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.agent.dto.AgentMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgentConversationStoreTest {

    @Mock StringRedisTemplate redis;
    @Mock ValueOperations<String, String> ops;

    AgentConversationStore store;
    AgentProperties properties;

    final UUID patient = UUID.randomUUID();
    final String conversationId = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        properties = new AgentProperties();
        store = new AgentConversationStore(redis, new ObjectMapper(), properties);
    }

    @Test
    @DisplayName("la clé porte l'identifiant du patient : deux comptes ne partagent pas un fil")
    void cle_estCloisonneeParPatient() {
        when(redis.opsForValue()).thenReturn(ops);

        store.ajouter(patient, conversationId, AgentMessage.user("bonjour"));

        ArgumentCaptor<String> cle = ArgumentCaptor.forClass(String.class);
        verify(ops).set(cle.capture(), anyString(), any(Duration.class));
        assertThat(cle.getValue()).isEqualTo("agent:conv:" + patient + ":" + conversationId);
    }

    @Test
    @DisplayName("fil vide : renvoie une liste vide, pas null")
    void filVide_renvoieListeVide() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get(anyString())).thenReturn(null);

        assertThat(store.lire(patient, conversationId)).isEmpty();
    }

    @Test
    @DisplayName("aller-retour de sérialisation : rôle et contenu préservés")
    void serialisation_preserveRoleEtContenu() throws Exception {
        when(redis.opsForValue()).thenReturn(ops);
        String json = new ObjectMapper().writeValueAsString(
                java.util.List.of(AgentMessage.user("cardiologue à Casa")));
        when(ops.get(anyString())).thenReturn(json);

        assertThat(store.lire(patient, conversationId)).singleElement().satisfies(m -> {
            assertThat(m.role()).isEqualTo(AgentMessage.ROLE_USER);
            assertThat(m.contenu()).isEqualTo("cardiologue à Casa");
        });
    }

    @Test
    @DisplayName("au-delà du plafond : seuls les derniers messages sont conservés")
    void plafond_tronqueLesPlusAnciens() throws Exception {
        properties.setHistoriqueMaxMessages(2);
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get(anyString())).thenReturn(new ObjectMapper().writeValueAsString(
                java.util.List.of(AgentMessage.user("un"), AgentMessage.assistant("deux"))));

        store.ajouter(patient, conversationId, AgentMessage.user("trois"));

        ArgumentCaptor<String> json = ArgumentCaptor.forClass(String.class);
        verify(ops).set(anyString(), json.capture(), any(Duration.class));
        assertThat(json.getValue()).contains("deux").contains("trois").doesNotContain("\"un\"");
    }

    @Test
    @DisplayName("Redis indisponible : l'assistant continue sans mémoire du tour précédent")
    void redisIndisponible_degradeSansEchouer() {
        when(redis.opsForValue()).thenThrow(new IllegalStateException("redis down"));

        assertThat(store.lire(patient, conversationId)).isEmpty();
        assertThatCode(() -> store.ajouter(patient, conversationId, AgentMessage.user("bonjour")))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("JSON corrompu : traité comme un fil vide")
    void jsonCorrompu_traiteCommeFilVide() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get(anyString())).thenReturn("{ pas du json");

        assertThat(store.lire(patient, conversationId)).isEmpty();
    }
}
