package ma.doctorek.doctorek.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

/** Synchronise le gabarit partagé qui contrôle le recto des passes Doctorek. */
@Service
public class GoogleWalletClassService {

    private static final URI TOKEN_ENDPOINT = URI.create("https://oauth2.googleapis.com/token");
    private static final String CLASS_ENDPOINT =
            "https://walletobjects.googleapis.com/walletobjects/v1/genericClass";
    private static final String WALLET_SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(12);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    private String synchronizedClassId;
    private String accessToken;
    private Instant accessTokenExpiresAt = Instant.EPOCH;

    @Autowired
    public GoogleWalletClassService(ObjectMapper objectMapper) {
        this(HttpClient.newBuilder()
                        .connectTimeout(REQUEST_TIMEOUT)
                        .build(),
                objectMapper,
                Clock.systemUTC());
    }

    GoogleWalletClassService(HttpClient httpClient, ObjectMapper objectMapper, Clock clock) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    /**
     * Applique une seule ligne de données au recto. Avec une ligne unique, Google Wallet
     * place le hero avant « N° adhérent / Statut », puis affiche le QR sous cette ligne.
     */
    public synchronized void ensurePremiumTemplate(String clientEmail,
                                                    PrivateKey privateKey,
                                                    String fullClassId) {
        if (fullClassId.equals(synchronizedClassId)) {
            return;
        }

        String token = accessToken(clientEmail, privateKey);
        String body = serialize(classPayload(fullClassId));
        HttpResponse<String> patchResponse = send(HttpRequest.newBuilder(classUri(fullClassId))
                .timeout(REQUEST_TIMEOUT)
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString(body))
                .build());

        if (patchResponse.statusCode() == 404) {
            HttpResponse<String> insertResponse = send(HttpRequest.newBuilder(URI.create(CLASS_ENDPOINT))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build());
            requireSuccess(insertResponse, "créer");
        } else {
            requireSuccess(patchResponse, "mettre à jour");
        }

        synchronizedClassId = fullClassId;
    }

    private String accessToken(String clientEmail, PrivateKey privateKey) {
        Instant now = clock.instant();
        if (accessToken != null && now.isBefore(accessTokenExpiresAt.minusSeconds(60))) {
            return accessToken;
        }

        String assertion = oauthAssertion(clientEmail, privateKey, now);
        String form = "grant_type=" + encode("urn:ietf:params:oauth:grant-type:jwt-bearer")
                + "&assertion=" + encode(assertion);
        HttpResponse<String> response = send(HttpRequest.newBuilder(TOKEN_ENDPOINT)
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build());
        requireSuccess(response, "obtenir le jeton d'accès");

        try {
            JsonNode json = objectMapper.readTree(response.body());
            String token = json.path("access_token").asText();
            long expiresIn = json.path("expires_in").asLong(3600);
            if (token.isBlank()) {
                throw new IllegalStateException("Google Wallet n'a pas retourné de jeton d'accès");
            }
            accessToken = token;
            accessTokenExpiresAt = now.plusSeconds(expiresIn);
            return token;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Réponse OAuth Google Wallet invalide", e);
        }
    }

    private static String oauthAssertion(String clientEmail, PrivateKey privateKey, Instant now) {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(clientEmail)
                .audience(TOKEN_ENDPOINT.toString())
                .claim("scope", WALLET_SCOPE)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(3600)))
                .build();
        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).build(), claims);
            jwt.sign(new RSASSASigner(privateKey));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Impossible de signer l'authentification Google Wallet", e);
        }
    }

    private Map<String, Object> classPayload(String fullClassId) {
        return Map.of(
                "id", fullClassId,
                "classTemplateInfo", Map.of(
                        "cardTemplateOverride", Map.of(
                                "cardRowTemplateInfos", List.of(Map.of(
                                        "twoItems", Map.of(
                                                "startItem", templateItem("member"),
                                                "endItem", templateItem("status")
                                        )
                                ))
                        ),
                        "detailsTemplateOverride", Map.of(
                                "detailsItemInfos", List.of(
                                        detailsItem("member"),
                                        detailsItem("status"),
                                        detailsItem("coverage")
                                )
                        )
                )
        );
    }

    private static Map<String, Object> detailsItem(String moduleId) {
        return Map.of("item", templateItem(moduleId));
    }

    private static Map<String, Object> templateItem(String moduleId) {
        return Map.of("firstValue", Map.of(
                "fields", List.of(Map.of(
                        "fieldPath", "object.textModulesData['" + moduleId + "']"
                ))
        ));
    }

    private String serialize(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Impossible de sérialiser le gabarit Google Wallet", e);
        }
    }

    private HttpResponse<String> send(HttpRequest request) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new IllegalStateException("Google Wallet est momentanément inaccessible", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Synchronisation Google Wallet interrompue", e);
        }
    }

    private static void requireSuccess(HttpResponse<String> response, String action) {
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "Impossible de " + action + " le gabarit Google Wallet (HTTP "
                            + response.statusCode() + ")"
            );
        }
    }

    private static URI classUri(String fullClassId) {
        return URI.create(CLASS_ENDPOINT + "/" + encode(fullClassId));
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
