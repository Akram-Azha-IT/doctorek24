package ma.doctorek.doctorek.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/** Valeurs par défaut d'une inscription en liste d'attente. */
class ListeAttenteEntityTest {

    @Test
    @DisplayName("une inscription naît active et horodatée")
    void onCreate_valeursParDefaut() {
        // Arrange
        ListeAttenteEntity entity = new ListeAttenteEntity();

        // Act
        entity.onCreate();

        // Assert
        assertThat(entity.getStatut()).isEqualTo("ACTIVE");
        assertThat(entity.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("un statut déjà posé n'est pas écrasé")
    void onCreate_statutExistant_conserve() {
        // Arrange — une inscription rechargée ne doit pas repasser ACTIVE.
        ListeAttenteEntity entity = new ListeAttenteEntity();
        entity.setStatut("SERVIE");
        entity.setCreatedAt(Instant.EPOCH);

        // Act
        entity.onCreate();

        // Assert
        assertThat(entity.getStatut()).isEqualTo("SERVIE");
        assertThat(entity.getCreatedAt()).isEqualTo(Instant.EPOCH);
    }
}
