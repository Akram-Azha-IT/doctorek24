package ma.doctorek.doctorek.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;

/**
 * Fuseau de référence pour tout raisonnement en heure murale.
 *
 * <p>Les rendez-vous sont stockés en heure locale ({@code date_rdv}, {@code heure_rdv})
 * telle qu'affichée au patient. Le conteneur, lui, tourne en UTC : sans fuseau explicite,
 * un rappel calculé sur {@code now()} viserait une heure décalée du décalage marocain.
 *
 * <p>Ne concerne pas les horodatages de création, qui restent en UTC.
 */
@Configuration
public class TempsConfig {

    @Bean
    public ZoneId zoneApplication(@Value("${doctorek.timezone:Africa/Casablanca}") String zone) {
        return ZoneId.of(zone);
    }
}
