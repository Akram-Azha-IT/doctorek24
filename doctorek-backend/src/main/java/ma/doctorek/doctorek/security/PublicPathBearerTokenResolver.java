package ma.doctorek.doctorek.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Returns null (no token) for public paths so that an invalid/stale Bearer
 * token in the client's Authorization header does not trigger a 401 before
 * the permitAll() rules can apply.
 *
 * IMPORTANT: patterns must match the SecurityConfig permitAll() rules exactly.
 * Over-broad prefixes will strip tokens from protected sibling endpoints
 * (e.g. "/api/v1/agenda/medecins" would also match "/medecins/{id}/rdv").
 */
public class PublicPathBearerTokenResolver implements BearerTokenResolver {

    private static final List<String> PUBLIC_PREFIXES = List.of(
        "/api/v1/auth/register/patient",
        "/api/v1/auth/register/medecin",
        "/api/v1/auth/verify-email",
        "/actuator/health",
        "/swagger-ui",
        "/api-docs"
    );

    private static final List<Pattern> PUBLIC_PATTERNS = List.of(
        // GET /api/v1/annuaire/medecins (list + nearby + by-id)
        Pattern.compile("^/api/v1/annuaire/medecins(/[^/]+)?/?$"),
        Pattern.compile("^/api/v1/annuaire/medecins/nearby/?$"),
        // GET /api/v1/agenda/medecins/{id}/creneaux (booking flow only)
        Pattern.compile("^/api/v1/agenda/medecins/[^/]+/creneaux/?$"),
        // GET /api/v1/carte/ref/{cardRef} (emergency QR scan)
        Pattern.compile("^/api/v1/carte/ref/[^/]+/?$"),
        // GET /api/v1/patients/rattachement/{token} (info masquée compte famille)
        Pattern.compile("^/api/v1/patients/rattachement/[^/]+/?$")
    );

    private final DefaultBearerTokenResolver delegate = new DefaultBearerTokenResolver();

    @Override
    public String resolve(HttpServletRequest request) {
        String path = request.getRequestURI();
        for (String prefix : PUBLIC_PREFIXES) {
            if (path.startsWith(prefix)) return null;
        }
        // PUBLIC_PATTERNS are read-only (GET) — do not strip tokens for mutating methods
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            for (Pattern pattern : PUBLIC_PATTERNS) {
                if (pattern.matcher(path).matches()) return null;
            }
        }
        return delegate.resolve(request);
    }
}
