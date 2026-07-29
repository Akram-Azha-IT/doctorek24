package ma.doctorek.doctorek.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Fuseau applicatif et valeurs par défaut d'une inscription. */
class TempsConfigTest {

    private final TempsConfig config = new TempsConfig();

    @Test
    @DisplayName("le fuseau configuré est celui utilisé par l'application")
    void zoneApplication_valeurConfiguree() {
        assertThat(config.zoneApplication("Africa/Casablanca"))
            .isEqualTo(ZoneId.of("Africa/Casablanca"));
    }

    @Test
    @DisplayName("un fuseau inconnu échoue au démarrage plutôt qu'en silence")
    void zoneApplication_fuseauInconnu_echoue() {
        // Un décalage muet sur les rappels serait bien plus coûteux à diagnostiquer.
        assertThatThrownBy(() -> config.zoneApplication("Mars/Olympus"))
            .isInstanceOf(RuntimeException.class);
    }
}
