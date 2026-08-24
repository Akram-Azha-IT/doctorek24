package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentCard;
import ma.doctorek.doctorek.agent.dto.AgentChatRequest;
import ma.doctorek.doctorek.agent.dto.AgentChatResponse;
import ma.doctorek.doctorek.agent.dto.AgentMessage;
import ma.doctorek.doctorek.exception.AgentIndisponibleException;
import ma.doctorek.doctorek.exception.AgentFournisseurException;
import ma.doctorek.doctorek.service.RateLimiterService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Le client de modèle est remplacé par une implémentation locale : la chaîne
 * d'intégration ne doit jamais appeler un fournisseur externe.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AgentServiceTest {

    @Mock ObjectProvider<AgentModelClient> modelProvider;
    @Mock AgentConversationStore historique;
    @Mock RateLimiterService rateLimiter;

    AgentProperties properties;
    AgentService service;

    final UUID patient = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        properties = new AgentProperties();
        service = new AgentService(modelProvider, historique, rateLimiter, properties);
    }

    @AfterEach
    void tearDown() {
        AgentTurnContext.clear();
    }

    private void modele(AgentModelClient client) {
        when(modelProvider.getIfAvailable()).thenReturn(client);
    }

    private AgentChatRequest question(String conversationId, String message) {
        return new AgentChatRequest(conversationId, message, null, null);
    }

    @Test
    @DisplayName("aucun modèle configuré : 503 plutôt qu'une erreur au démarrage")
    void sansModele_leve503() {
        modele(null);

        assertThatThrownBy(() -> service.repondre(patient, question(null, "bonjour")))
                .isInstanceOf(AgentIndisponibleException.class);

        assertThat(service.estDisponible()).isFalse();
        verify(rateLimiter, never()).checkAndIncrement(anyString(), any(), org.mockito.ArgumentMatchers.anyInt(), any());
    }

    @Test
    @DisplayName("le quota anti-flood est appliqué avant tout appel au modèle")
    void quota_appliqueAvantLAppel() {
        modele((h, q) -> "ok");

        service.repondre(patient, question(null, "bonjour"));

        verify(rateLimiter).checkAndIncrement(eq("agent"), eq(patient),
                eq(properties.getQuotaMessages()), eq(Duration.ofMinutes(5)));
    }

    @Test
    @DisplayName("sans identifiant de fil : le serveur en génère un")
    void sansConversationId_enGenereUn() {
        modele((h, q) -> "ok");

        AgentChatResponse reponse = service.repondre(patient, question(null, "bonjour"));

        assertThat(reponse.conversationId()).isNotBlank();
        assertThat(UUID.fromString(reponse.conversationId())).isNotNull();
    }

    @Test
    @DisplayName("identifiant de fil valide : conservé d'un tour à l'autre")
    void conversationIdValide_estConserve() {
        modele((h, q) -> "ok");
        String fil = UUID.randomUUID().toString();

        assertThat(service.repondre(patient, question(fil, "bonjour")).conversationId())
                .isEqualTo(fil);
    }

    @Test
    @DisplayName("identifiant de fil forgé : ignoré, aucune clé Redis arbitraire")
    void conversationIdForge_estIgnore() {
        modele((h, q) -> "ok");

        String renvoye = service.repondre(patient, question("agent:conv:*", "bonjour")).conversationId();

        assertThat(renvoye).isNotEqualTo("agent:conv:*");
        assertThat(UUID.fromString(renvoye)).isNotNull();
    }

    @Test
    @DisplayName("l'historique reçoit la question puis la réponse")
    void historique_recoitLesDeuxMessages() {
        modele((h, q) -> "3 cardiologues correspondent.");
        when(historique.lire(eq(patient), anyString())).thenReturn(List.of());

        service.repondre(patient, question(null, "cardiologue à Casa"));

        ArgumentCaptor<AgentMessage> captor = ArgumentCaptor.forClass(AgentMessage.class);
        verify(historique).ajouter(eq(patient), anyString(), captor.capture(), captor.capture());

        assertThat(captor.getAllValues()).extracting(AgentMessage::role)
                .containsExactly(AgentMessage.ROLE_USER, AgentMessage.ROLE_ASSISTANT);
        assertThat(captor.getAllValues().get(1).contenu()).isEqualTo("3 cardiologues correspondent.");
    }

    @Test
    @DisplayName("l'historique du fil est transmis au modèle")
    void historique_estTransmisAuModele() {
        List<AgentMessage> fil = List.of(AgentMessage.user("bonjour"), AgentMessage.assistant("bonjour"));
        String conversationId = UUID.randomUUID().toString();
        when(historique.lire(patient, conversationId)).thenReturn(fil);

        modele((h, q) -> "reçu " + h.size());

        assertThat(service.repondre(patient, question(conversationId, "et ensuite ?")).texte())
                .isEqualTo("reçu 2");
    }

    @Test
    @DisplayName("les cartes déposées par les outils remontent dans la réponse")
    void cartes_remontentDansLaReponse() {
        modele((h, q) -> {
            AgentTurnContext.courant().enregistrerAppel("rechercher_medecins");
            AgentTurnContext.courant().ajouterCarte(AgentCard.TYPE_MEDECINS, List.of("médecin"));
            return "3 cardiologues correspondent.";
        });

        AgentChatResponse reponse = service.repondre(patient, question(null, "cardiologue"));

        assertThat(reponse.cartes()).singleElement()
                .extracting(AgentCard::type).isEqualTo(AgentCard.TYPE_MEDECINS);
        assertThat(reponse.outilsAppeles()).containsExactly("rechercher_medecins");
    }

    @Test
    @DisplayName("le contexte de tour est détaché même quand le modèle échoue")
    void contexte_estDetacheApresUneErreur() {
        modele((h, q) -> {
            throw new IllegalStateException("modèle indisponible");
        });

        assertThatThrownBy(() -> service.repondre(patient, question(null, "bonjour")))
                .isInstanceOf(AgentFournisseurException.class)
                .hasCauseInstanceOf(IllegalStateException.class);

        assertThatThrownBy(AgentTurnContext::courant)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("hors d'un tour");
    }

    @Test
    @DisplayName("la position du navigateur est portée par le tour, pas par le modèle")
    void position_estPorteeParLeTour() {
        modele((h, q) -> {
            assertThat(AgentTurnContext.courant().position()).isPresent();
            return "ok";
        });

        service.repondre(patient, new AgentChatRequest(null, "près de moi", 33.57, -7.58));
    }
}
