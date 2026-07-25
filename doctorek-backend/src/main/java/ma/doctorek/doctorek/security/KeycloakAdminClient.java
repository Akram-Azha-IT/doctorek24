package ma.doctorek.doctorek.security;

import ma.doctorek.doctorek.enums.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class KeycloakAdminClient {

    private static final Logger log = LoggerFactory.getLogger(KeycloakAdminClient.class);

    private static final String USERS_PATH = "/users/";

    private final RestClient restClient;

    @Value("${keycloak.admin.url}")
    private String keycloakUrl;

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Value("${keycloak.admin.client-id}")
    private String clientId;

    @Value("${keycloak.admin.client-secret}")
    private String clientSecret;

    public KeycloakAdminClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    /**
     * Creates a user in Keycloak, assigns the given role, and returns the Keycloak UUID.
     */
    public String createUser(String email, String firstName, String lastName,
                             String password, Role role) {
        String adminToken = getAdminToken();

        String userId = postUser(adminToken, email, firstName, lastName, password);
        assignRole(adminToken, userId, role);

        return userId;
    }

    /**
     * Assigns a realm role to an existing Keycloak user. Used to grant the app role to users
     * created outside the register flow (e.g. brokered Google sign-in), since the realm role
     * gates the API and is otherwise absent from their token.
     */
    public void assignRealmRole(String keycloakUserId, Role role) {
        assignRole(getAdminToken(), keycloakUserId, role);
    }

    private String getAdminToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
            .uri(keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(Map.class);

        if (response == null || !response.containsKey("access_token")) {
            throw new KeycloakIntegrationException("Failed to obtain Keycloak admin token");
        }
        return (String) response.get("access_token");
    }

    private String postUser(String adminToken, String email, String firstName,
                            String lastName, String password) {
        Map<String, Object> userBody = Map.of(
            "username", email,
            "email", email,
            "firstName", firstName,
            "lastName", lastName,
            // Disabled until the email verification code is validated — an
            // unverified account must not be able to log in.
            "enabled", false,
            "emailVerified", false,
            "credentials", List.of(Map.of(
                "type", "password",
                "value", password,
                "temporary", false
            ))
        );

        var response = restClient.post()
            .uri(keycloakUrl + "/admin/realms/" + realm + "/users")
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(userBody)
            .retrieve()
            .toBodilessEntity();

        // Keycloak returns 201 with Location: .../users/{id}
        var location = response.getHeaders().getLocation();
        if (location == null) {
            throw new KeycloakIntegrationException("Keycloak did not return user location header");
        }
        String path = location.getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private void assignRole(String adminToken, String userId, Role role) {
        String roleName = role.name();

        @SuppressWarnings("unchecked")
        Map<String, Object> roleRep = restClient.get()
            .uri(keycloakUrl + "/admin/realms/" + realm + "/roles/" + roleName)
            .header("Authorization", "Bearer " + adminToken)
            .retrieve()
            .body(Map.class);

        if (roleRep == null) {
            log.warn("Role {} not found in Keycloak realm {}", roleName, realm);
            return;
        }

        restClient.post()
            .uri(keycloakUrl + "/admin/realms/" + realm + USERS_PATH + userId + "/role-mappings/realm")
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(List.of(roleRep))
            .retrieve()
            .toBodilessEntity();
    }

    /**
     * Deletes a Keycloak user by its id. Frees the username/email in Keycloak so it
     * can be reused. Tolerates a missing user (already deleted) as a no-op.
     */
    public void deleteUser(String keycloakUserId) {
        String adminToken = getAdminToken();
        try {
            restClient.delete()
                .uri(keycloakUrl + "/admin/realms/" + realm + USERS_PATH + keycloakUserId)
                .header("Authorization", "Bearer " + adminToken)
                .retrieve()
                .toBodilessEntity();
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            log.warn("Keycloak user {} already absent — delete is a no-op", keycloakUserId);
        }
    }

    /**
     * Sets emailVerified=true and clears required actions for a Keycloak user.
     * Call this after local email verification to unblock ROPC login.
     */
    public void markEmailVerified(String keycloakUserId) {
        String adminToken = getAdminToken();
        Map<String, Object> update = Map.of(
            "enabled", true,
            "emailVerified", true,
            "requiredActions", List.of()
        );
        restClient.put()
            .uri(keycloakUrl + "/admin/realms/" + realm + USERS_PATH + keycloakUserId)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(update)
            .retrieve()
            .toBodilessEntity();
    }

    /**
     * Extends Keycloak realm token lifetimes. Safe to call on every startup (idempotent read-then-write).
     * accessTokenLifespan: seconds the access token lives (default Keycloak: 300 = 5 min).
     * ssoSessionMaxLifespan: max SSO session (controls refresh token max age).
     */
    @SuppressWarnings("unchecked")
    public void configureTokenLifetimes(int accessTokenLifespanSeconds, int ssoSessionMaxLifespanSeconds) {
        String adminToken = getAdminToken();

        // GET current realm to avoid overwriting unrelated fields
        Map<String, Object> realm = restClient.get()
            .uri(keycloakUrl + "/admin/realms/" + this.realm)
            .header("Authorization", "Bearer " + adminToken)
            .retrieve()
            .body(Map.class);

        if (realm == null) {
            log.warn("Could not read Keycloak realm settings — skipping token lifetime config");
            return;
        }

        realm.put("accessTokenLifespan", accessTokenLifespanSeconds);
        realm.put("ssoSessionMaxLifespan", ssoSessionMaxLifespanSeconds);
        realm.put("ssoSessionIdleTimeout", ssoSessionMaxLifespanSeconds);

        restClient.put()
            .uri(keycloakUrl + "/admin/realms/" + this.realm)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(realm)
            .retrieve()
            .toBodilessEntity();

        log.info("Keycloak realm '{}': accessTokenLifespan={}s, ssoSessionMaxLifespan={}s",
            this.realm, accessTokenLifespanSeconds, ssoSessionMaxLifespanSeconds);
    }

    public static class KeycloakIntegrationException extends RuntimeException {
        public KeycloakIntegrationException(String message) {
            super(message);
        }
    }
}
