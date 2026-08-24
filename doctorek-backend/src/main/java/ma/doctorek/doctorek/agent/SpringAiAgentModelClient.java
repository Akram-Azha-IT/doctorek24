package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentMessage;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.support.ToolCallbacks;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/**
 * Implémentation Spring AI de {@link AgentModelClient}.
 *
 * <p>Spring AI porte la boucle d'appel d'outils : il transmet le catalogue au
 * modèle, exécute la méthode Java demandée, réinjecte le résultat et recommence
 * jusqu'à ce que le modèle produise du texte. C'est la raison d'être du choix de
 * bibliothèque — cette boucle est la partie fastidieuse et facile à rater.
 *
 * <p>Les outils s'exécutent dans le thread de la requête HTTP, ce qui permet à
 * {@link AgentTools} de lire l'identité du patient dans {@link AgentTurnContext}
 * sans propagation manuelle.
 *
 * <p>Instancié par {@link AgentConfig}, lui-même conditionné à la présence d'un
 * modèle configuré : sans clé API, ce bean n'existe pas et l'assistant répond 503.
 */
public class SpringAiAgentModelClient implements AgentModelClient {

    private final ChatClient chatClient;
    private final ZoneId zone;

    public SpringAiAgentModelClient(ChatClient.Builder builder, AgentTools outils, ZoneId zone) {
        this.zone = zone;
        this.chatClient = builder
                .defaultToolCallbacks(ToolCallbacks.from(outils))
                .build();
    }

    @Override
    public String repondre(List<AgentMessage> historique, String question) {
        List<Message> messages = new ArrayList<>(historique.size() + 1);
        for (AgentMessage message : historique) {
            messages.add(message.estAssistant()
                    ? new AssistantMessage(message.contenu())
                    : new UserMessage(message.contenu()));
        }
        messages.add(new UserMessage(question));

        String reponse = chatClient.prompt()
                .system(AgentPrompt.systeme(LocalDate.now(zone)))
                .messages(messages)
                .call()
                .content();

        return reponse == null ? "" : reponse.trim();
    }
}
