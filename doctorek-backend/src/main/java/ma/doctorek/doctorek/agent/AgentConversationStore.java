package ma.doctorek.doctorek.agent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.agent.dto.AgentMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Historique de conversation, en Redis, avec expiration.
 *
 * <h2>Isolation</h2>
 * La clé inclut l'identifiant du patient : {@code agent:conv:{patientId}:{conversationId}}.
 * Deux patients ne peuvent pas partager un fil, même en devinant l'identifiant de
 * conversation de l'autre — la lecture est faite avec l'identité du jeton, pas
 * avec celle fournie dans la requête.
 *
 * <h2>Pas de persistance durable</h2>
 * Rien en base. Le fil expire au bout de la durée configurée. Une conversation
 * sur des rendez-vous médicaux est une donnée personnelle au sens de la loi 09-08 :
 * ne pas la conserver reste la façon la plus simple de la protéger.
 *
 * <h2>Dégradation</h2>
 * Redis indisponible : l'historique est vide, l'assistant répond quand même sans
 * mémoire du tour précédent. Même parti pris que {@code RateLimiterService} —
 * une panne de cache dégrade le service, elle ne l'interrompt pas.
 */
@Component
public class AgentConversationStore {

    private static final Logger log = LoggerFactory.getLogger(AgentConversationStore.class);
    private static final String PREFIXE = "agent:conv:";

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final AgentProperties properties;

    public AgentConversationStore(StringRedisTemplate redis,
                                  ObjectMapper mapper,
                                  AgentProperties properties) {
        this.redis = redis;
        this.mapper = mapper;
        this.properties = properties;
    }

    public List<AgentMessage> lire(UUID patientId, String conversationId) {
        try {
            String json = redis.opsForValue().get(cle(patientId, conversationId));
            if (json == null || json.isBlank()) {
                return List.of();
            }
            return mapper.readValue(json, new TypeReference<List<AgentMessage>>() { });
        } catch (Exception e) {
            log.warn("agent_historique_lecture_echouee conversationId={}", conversationId, e);
            return List.of();
        }
    }

    /** Ajoute les messages en fin de fil, tronque au plafond et repousse l'expiration. */
    public void ajouter(UUID patientId, String conversationId, AgentMessage... messages) {
        try {
            List<AgentMessage> fil = new ArrayList<>(lire(patientId, conversationId));
            fil.addAll(List.of(messages));

            int max = properties.getHistoriqueMaxMessages();
            if (fil.size() > max) {
                fil = new ArrayList<>(fil.subList(fil.size() - max, fil.size()));
            }

            redis.opsForValue().set(
                    cle(patientId, conversationId),
                    mapper.writeValueAsString(fil),
                    properties.getHistoriqueTtl());
        } catch (Exception e) {
            log.warn("agent_historique_ecriture_echouee conversationId={}", conversationId, e);
        }
    }

    private static String cle(UUID patientId, String conversationId) {
        return PREFIXE + patientId + ":" + conversationId;
    }
}
