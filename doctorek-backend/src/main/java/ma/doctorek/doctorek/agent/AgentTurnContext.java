package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentCard;
import ma.doctorek.doctorek.exception.AgentLimiteOutilsException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * État du tour de conversation en cours, porté par le thread de la requête.
 *
 * <p>Trois responsabilités :
 * <ol>
 *   <li><strong>Identité.</strong> Les outils y lisent l'identifiant du patient
 *       connecté. Il ne transite jamais par le modèle, qui ne peut donc pas en
 *       fabriquer un — un prompt manipulé ne donne accès à rien.</li>
 *   <li><strong>Collecte des cartes.</strong> Chaque outil y dépose le retour réel
 *       du service métier ; c'est ce que l'UI affichera, indépendamment du texte
 *       généré.</li>
 *   <li><strong>Plafond d'outils.</strong> Compteur incrémenté à chaque appel, qui
 *       interrompt la boucle interne de Spring AI si le modèle s'emballe.</li>
 * </ol>
 *
 * <p>Le porteur est un {@link ThreadLocal} plutôt qu'un bean de portée requête :
 * la boucle outils de Spring AI s'exécute de façon synchrone sur le thread
 * appelant, et un simple ThreadLocal reste testable sans contexte web.
 * {@link #clear()} est appelé dans un {@code finally} par le service.
 */
public final class AgentTurnContext {

    private static final ThreadLocal<AgentTurnContext> COURANT = new ThreadLocal<>();

    private final UUID patientId;
    private final Double latitude;
    private final Double longitude;
    private final int maxOutils;
    private final List<AgentCard> cartes = new ArrayList<>();
    private final List<String> outilsAppeles = new ArrayList<>();

    private AgentTurnContext(UUID patientId, Double latitude, Double longitude, int maxOutils) {
        this.patientId = patientId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.maxOutils = maxOutils;
    }

    /** Ouvre un tour et l'attache au thread courant. */
    public static AgentTurnContext ouvrir(UUID patientId, Double latitude, Double longitude, int maxOutils) {
        AgentTurnContext contexte = new AgentTurnContext(patientId, latitude, longitude, maxOutils);
        COURANT.set(contexte);
        return contexte;
    }

    /**
     * Contexte du thread courant.
     *
     * @throws IllegalStateException si un outil est invoqué hors d'un tour ouvert —
     *                               signe d'un bug d'orchestration, jamais d'une entrée utilisateur
     */
    public static AgentTurnContext courant() {
        AgentTurnContext contexte = COURANT.get();
        if (contexte == null) {
            throw new IllegalStateException("Outil de l'agent invoqué hors d'un tour de conversation");
        }
        return contexte;
    }

    public static void clear() {
        COURANT.remove();
    }

    /**
     * Enregistre un appel d'outil et rend la carte à alimenter.
     *
     * @throws AgentLimiteOutilsException au-delà du plafond du tour
     */
    public void enregistrerAppel(String nomOutil) {
        if (outilsAppeles.size() >= maxOutils) {
            throw new AgentLimiteOutilsException(maxOutils);
        }
        outilsAppeles.add(nomOutil);
    }

    public void ajouterCarte(String type, Object donnees) {
        cartes.add(new AgentCard(type, donnees));
    }

    public UUID patientId() {
        return patientId;
    }

    /** Position du navigateur, absente si le patient n'a pas accordé la géolocalisation. */
    public Optional<double[]> position() {
        if (latitude == null || longitude == null) {
            return Optional.empty();
        }
        return Optional.of(new double[] { latitude, longitude });
    }

    public List<AgentCard> cartes() {
        return Collections.unmodifiableList(cartes);
    }

    public List<String> outilsAppeles() {
        return Collections.unmodifiableList(outilsAppeles);
    }
}
