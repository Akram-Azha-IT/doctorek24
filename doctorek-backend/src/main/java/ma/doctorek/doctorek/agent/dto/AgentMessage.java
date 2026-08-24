package ma.doctorek.doctorek.agent.dto;

/**
 * Message d'historique conservé entre deux tours.
 *
 * <p>Type volontairement neutre : il ne dépend d'aucune classe Spring AI, ce qui
 * permet de sérialiser l'historique en JSON dans Redis et de changer de
 * fournisseur de modèle sans toucher au stockage.
 *
 * @param role    {@code user} ou {@code assistant}
 * @param contenu texte du message
 */
public record AgentMessage(String role, String contenu) {

    public static final String ROLE_USER = "user";
    public static final String ROLE_ASSISTANT = "assistant";

    public static AgentMessage user(String contenu) {
        return new AgentMessage(ROLE_USER, contenu);
    }

    public static AgentMessage assistant(String contenu) {
        return new AgentMessage(ROLE_ASSISTANT, contenu);
    }

    public boolean estAssistant() {
        return ROLE_ASSISTANT.equals(role);
    }
}
