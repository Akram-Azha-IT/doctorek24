package ma.doctorek.doctorek.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    private final JwtAuthConverter jwtAuthConverter;

    public SecurityConfig(JwtAuthConverter jwtAuthConverter) {
        this.jwtAuthConverter = jwtAuthConverter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // public registration, email verification & login
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/register/patient").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/register/medecin").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/verify-email").permitAll()
                // public annuaire (read-only)
                .requestMatchers(HttpMethod.GET, "/api/v1/annuaire/medecins").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/annuaire/medecins/nearby").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/annuaire/medecins/*").permitAll()
                // public creneaux (booking flow)
                .requestMatchers(HttpMethod.GET, "/api/v1/agenda/medecins/*/creneaux").permitAll()
                // public emergency QR scan: exposes only the vital subset (never sensible fields)
                .requestMatchers(HttpMethod.GET, "/api/v1/carte/ref/*").permitAll()
                // OTP flow for the sensible section (code sent to the patient, gated by grant token)
                .requestMatchers(HttpMethod.POST, "/api/v1/carte/ref/*/otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/carte/ref/*/otp/verify").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/carte/ref/*/sensible").permitAll()
                // public rattachement info (compte famille) — masked data only, claim requires auth
                .requestMatchers(HttpMethod.GET, "/api/v1/patients/rattachement/*").permitAll()
                // websocket handshake (JWT auth via STOMP CONNECT interceptor)
                .requestMatchers("/ws/**").permitAll()
                // infrastructure
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**").permitAll()
                // everything else requires a valid Keycloak JWT
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .bearerTokenResolver(new PublicPathBearerTokenResolver())
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter))
            )
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/ws/**", config);
        return source;
    }
}
