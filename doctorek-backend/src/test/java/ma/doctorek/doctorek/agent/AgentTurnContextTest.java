package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentCard;
import ma.doctorek.doctorek.exception.AgentLimiteOutilsException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AgentTurnContextTest {

    private final UUID patient = UUID.randomUUID();

    @AfterEach
    void tearDown() {
        AgentTurnContext.clear();
    }

    @Test
    @DisplayName("hors d'un tour ouvert : lève IllegalStateException")
    void horsTour_leveException() {
        assertThatThrownBy(AgentTurnContext::courant)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("hors d'un tour");
    }

    @Test
    @DisplayName("le tour ouvert porte l'identité du patient")
    void tourOuvert_porteIdentite() {
        AgentTurnContext.ouvrir(patient, null, null, 6);
        assertThat(AgentTurnContext.courant().patientId()).isEqualTo(patient);
    }

    @Test
    @DisplayName("position absente quand une seule coordonnée est fournie")
    void positionPartielle_estAbsente() {
        AgentTurnContext contexte = AgentTurnContext.ouvrir(patient, 33.57, null, 6);
        assertThat(contexte.position()).isEmpty();
    }

    @Test
    @DisplayName("position présente quand les deux coordonnées sont fournies")
    void positionComplete_estPresente() {
        AgentTurnContext contexte = AgentTurnContext.ouvrir(patient, 33.57, -7.58, 6);
        assertThat(contexte.position()).isPresent();
        assertThat(contexte.position().get()).containsExactly(33.57, -7.58);
    }

    @Test
    @DisplayName("au plafond d'outils : lève AgentLimiteOutilsException")
    void plafondOutils_leveException() {
        AgentTurnContext contexte = AgentTurnContext.ouvrir(patient, null, null, 2);
        contexte.enregistrerAppel("a");
        contexte.enregistrerAppel("b");

        assertThatThrownBy(() -> contexte.enregistrerAppel("c"))
                .isInstanceOf(AgentLimiteOutilsException.class);
        assertThat(contexte.outilsAppeles()).containsExactly("a", "b");
    }

    @Test
    @DisplayName("les cartes sont conservées dans l'ordre d'ajout")
    void cartes_conserventLOrdre() {
        AgentTurnContext contexte = AgentTurnContext.ouvrir(patient, null, null, 6);
        contexte.ajouterCarte(AgentCard.TYPE_MEDECINS, "A");
        contexte.ajouterCarte(AgentCard.TYPE_CRENEAUX, "B");

        assertThat(contexte.cartes())
                .extracting(AgentCard::type)
                .containsExactly(AgentCard.TYPE_MEDECINS, AgentCard.TYPE_CRENEAUX);
    }

    @Test
    @DisplayName("clear détache le tour du thread")
    void clear_detacheLeTour() {
        AgentTurnContext.ouvrir(patient, null, null, 6);
        assertThatCode(AgentTurnContext::courant).doesNotThrowAnyException();

        AgentTurnContext.clear();

        assertThatThrownBy(AgentTurnContext::courant).isInstanceOf(IllegalStateException.class);
    }
}
