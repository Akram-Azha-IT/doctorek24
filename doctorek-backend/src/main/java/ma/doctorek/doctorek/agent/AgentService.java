package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentChatRequest;
import ma.doctorek.doctorek.agent.dto.AgentChatResponse;
import ma.doctorek.doctorek.agent.dto.AgentMessage;
import ma.doctorek.doctorek.exception.AgentIndisponibleException;
import ma.doctorek.doctorek.exception.AgentFournisseurException;
import ma.doctorek.doctorek.service.RateLimiterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Orchestration d'un tour de conversation avec l'assistant.
 *
 * <h2>Ce que fait un tour</h2>
 * <pre>
 *   quota anti-flood
 *      → ouverture du contexte de tour (identité, position, plafond d'outils)
 *      → lecture de l'historique du fil
 *      → appel du modèle, qui déclenche les outils dont il a besoin
 *      → écriture de l'historique
 *      → assemblage : texte du modèle + cartes collectées par les outils
 * </pre>
 *
 * <h2>Les trois règles du module</h2>
 * <ol>
 *   <li><strong>Le modèle n'écrit pas les données.</strong> Il choisit les outils ;
 *       les cartes affichées viennent de {@link AgentTurnContext}, alimenté par les
 *       retours réels des services métier. Un nom de praticien ou un horaire ne
 *       peut donc pas être inventé.</li>
 *   <li><strong>L'identité ne transite pas par le modèle.</strong> Elle est posée ici,
 *       depuis le jeton Keycloak résolu par le contrôleur, et lue directement par
 *       les outils. Aucune signature d'outil n'accepte d'identifiant patient.</li>
 *   <li><strong>Aucun outil n'écrit en base.</strong> {@code preparer_rdv} produit une
 *       proposition ; la réservation reste le chemin existant, déclenché par le
 *       patient. Au pire, un modèle qui déraille produit une phrase inexacte.</li>
 * </ol>
 *
 * <h2>Module optionnel</h2>
 * {@link AgentModelClient} est injecté via {@link ObjectProvider} : sans modèle
 * configuré, le bean n'existe pas et le service répond 503 au lieu d'empêcher
 * l'application de démarrer.
 */
@Service
public class AgentService {

    private static final Logger log = LoggerFactory.getLogger(AgentService.class);
    private static final String ACTION_QUOTA = "agent";

    private final ObjectProvider<AgentModelClient> modelClient;
    private final AgentConversationStore historique;
    private final RateLimiterService rateLimiter;
    private final AgentProperties properties;

    public AgentService(ObjectProvider<AgentModelClient> modelClient,
                        AgentConversationStore historique,
                        RateLimiterService rateLimiter,
                        AgentProperties properties) {
        this.modelClient = modelClient;
        this.historique = historique;
        this.rateLimiter = rateLimiter;
        this.properties = properties;
    }

    /** Vrai si un modèle est configuré. Permet au frontend de masquer l'assistant. */
    public boolean estDisponible() {
        return modelClient.getIfAvailable() != null;
    }

    /**
     * Traite une question du patient.
     *
     * @param patientId identifiant issu du jeton, jamais du corps de la requête
     * @param requete   question et position facultative
     */
    public AgentChatResponse repondre(UUID patientId, AgentChatRequest requete) {
        AgentModelClient client = modelClient.getIfAvailable();
        if (client == null) {
            throw new AgentIndisponibleException();
        }

        rateLimiter.checkAndIncrement(ACTION_QUOTA, patientId,
                properties.getQuotaMessages(), properties.getQuotaFenetre());

        String conversationId = resoudreConversationId(requete.conversationId());
        long debut = System.currentTimeMillis();

        AgentTurnContext contexte = AgentTurnContext.ouvrir(
                patientId, requete.latitude(), requete.longitude(), properties.getMaxOutilsParTour());
        try {
            List<AgentMessage> fil = historique.lire(patientId, conversationId);
            String texte;
            try {
                texte = client.repondre(fil, requete.message());
            } catch (RuntimeException exception) {
                Throwable racine = causeRacine(exception);
                log.error("agent_fournisseur_echec type={} message={}",
                        racine.getClass().getSimpleName(), racine.getMessage(), exception);
                throw new AgentFournisseurException(exception);
            }

            historique.ajouter(patientId, conversationId,
                    AgentMessage.user(requete.message()),
                    AgentMessage.assistant(texte));

            // Trace sans contenu : ni la question ni la réponse ne sont journalisées,
            // elles peuvent porter des informations de santé.
            log.info("agent_tour patientId={} outils={} cartes={} dureeMs={}",
                    patientId, contexte.outilsAppeles(), contexte.cartes().size(),
                    System.currentTimeMillis() - debut);

            return new AgentChatResponse(conversationId, texte,
                    contexte.cartes(), contexte.outilsAppeles());
        } finally {
            AgentTurnContext.clear();
        }
    }

    /**
     * Valide l'identifiant de fil fourni par le client, ou en crée un.
     *
     * <p>Seul un UUID est accepté : cette valeur entre dans une clé Redis, et une
     * chaîne libre permettrait de sonder ou d'écraser d'autres clés du cache.
     */
    private static String resoudreConversationId(String fourni) {
        if (fourni == null || fourni.isBlank()) {
            return UUID.randomUUID().toString();
        }
        try {
            return UUID.fromString(fourni.trim()).toString();
        } catch (IllegalArgumentException e) {
            return UUID.randomUUID().toString();
        }
    }

    private static Throwable causeRacine(Throwable exception) {
        Throwable racine = exception;
        while (racine.getCause() != null && racine.getCause() != racine) {
            racine = racine.getCause();
        }
        return racine;
    }
}
