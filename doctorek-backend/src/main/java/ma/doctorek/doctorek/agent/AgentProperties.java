package ma.doctorek.doctorek.agent;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Plafonds du module agent. Tous ont une valeur par défaut sûre : le module
 * fonctionne sans aucune ligne de configuration.
 *
 * <p>Ces bornes existent d'abord pour le coût. Le palier gratuit Gemini compte
 * en requêtes par minute et par jour ; or un tour de conversation déclenche
 * autant d'appels au modèle qu'il enchaîne d'outils. Sans plafond, une question
 * mal formulée peut consommer une dizaine de requêtes.
 */
@Component
@ConfigurationProperties(prefix = "doctorek.agent")
public class AgentProperties {

    /** Appels d'outils autorisés pour un même tour de conversation. */
    private int maxOutilsParTour = 6;

    /** Messages d'historique réinjectés dans le prompt (paires patient/assistant confondues). */
    private int historiqueMaxMessages = 12;

    /** Durée de vie de l'historique dans Redis. */
    private Duration historiqueTtl = Duration.ofMinutes(30);

    /** Messages autorisés par patient sur la fenêtre {@link #quotaFenetre}. */
    private int quotaMessages = 20;

    private Duration quotaFenetre = Duration.ofMinutes(5);

    /** Médecins renvoyés au modèle par recherche. Au-delà, le prompt gonfle sans gain. */
    private int maxResultatsRecherche = 5;

    /** Jours explorés en une fois par l'outil de créneaux. */
    private int maxJoursCreneaux = 7;

    public int getMaxOutilsParTour() {
        return maxOutilsParTour;
    }

    public void setMaxOutilsParTour(int maxOutilsParTour) {
        this.maxOutilsParTour = maxOutilsParTour;
    }

    public int getHistoriqueMaxMessages() {
        return historiqueMaxMessages;
    }

    public void setHistoriqueMaxMessages(int historiqueMaxMessages) {
        this.historiqueMaxMessages = historiqueMaxMessages;
    }

    public Duration getHistoriqueTtl() {
        return historiqueTtl;
    }

    public void setHistoriqueTtl(Duration historiqueTtl) {
        this.historiqueTtl = historiqueTtl;
    }

    public int getQuotaMessages() {
        return quotaMessages;
    }

    public void setQuotaMessages(int quotaMessages) {
        this.quotaMessages = quotaMessages;
    }

    public Duration getQuotaFenetre() {
        return quotaFenetre;
    }

    public void setQuotaFenetre(Duration quotaFenetre) {
        this.quotaFenetre = quotaFenetre;
    }

    public int getMaxResultatsRecherche() {
        return maxResultatsRecherche;
    }

    public void setMaxResultatsRecherche(int maxResultatsRecherche) {
        this.maxResultatsRecherche = maxResultatsRecherche;
    }

    public int getMaxJoursCreneaux() {
        return maxJoursCreneaux;
    }

    public void setMaxJoursCreneaux(int maxJoursCreneaux) {
        this.maxJoursCreneaux = maxJoursCreneaux;
    }
}
