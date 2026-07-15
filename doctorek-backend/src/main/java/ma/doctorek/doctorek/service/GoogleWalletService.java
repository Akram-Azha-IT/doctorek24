package ma.doctorek.doctorek.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import ma.doctorek.doctorek.config.GoogleWalletProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GoogleWalletService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GoogleWalletProperties properties;
    private final ResourceLoader resourceLoader;
    private final String frontendUrl;

    private String clientEmail;
    private PrivateKey privateKey;

    public GoogleWalletService(GoogleWalletProperties properties,
                                ResourceLoader resourceLoader,
                                @Value("${app.frontend-url}") String frontendUrl) {
        this.properties = properties;
        this.resourceLoader = resourceLoader;
        this.frontendUrl = frontendUrl;
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    /**
     * Builds a "Save to Google Wallet" URL embedding a signed JWT
     * describing a Generic pass for the given carte virtuelle.
     */
    public String buildSaveUrl(String cardRef, String firstName, String lastName,
                                String numIdentite, String assuranceNumero, String photoUrl) {
        loadServiceAccountIfNeeded();

        String issuerId = properties.getIssuerId();
        String fullClassId = issuerId + "." + properties.getClassId();
        String qrUrl = frontendUrl + "/carte/" + cardRef;

        String fullName = (firstName == null ? "" : firstName) + " "
                + (lastName == null ? "" : lastName.toUpperCase());

        // Google's "save to wallet" URL only CREATES an object; if the id already exists it reuses
        // the stored data and ignores the JWT's fields — so edits (photo, CIN, CNSS...) never show.
        // Version the object id with a hash of the displayed content: any change yields a new object
        // the user adds fresh, always reflecting current data.
        // "v2" = refonte visuelle (hero officiel + fond marine) : force un nouvel objet
        // pour que les utilisateurs ré-ajoutant la carte voient le nouveau design.
        String contentVersion = shortHash(String.join("|", "v2",
                fullName, nullToEmpty(numIdentite), nullToEmpty(assuranceNumero), nullToEmpty(photoUrl)));
        String objectSuffix = sanitize(cardRef) + "-" + contentVersion;
        String fullObjectId = issuerId + "." + objectSuffix;

        Map<String, Object> genericObject = new java.util.LinkedHashMap<>();
        genericObject.put("id", fullObjectId);
        genericObject.put("classId", fullClassId);
        genericObject.put("genericType", "GENERIC_TYPE_UNSPECIFIED");
        genericObject.put("state", "ACTIVE");
        genericObject.put("cardTitle", textValue("Doctorek"));
        genericObject.put("subheader", textValue("Carte Santé Virtuelle"));
        genericObject.put("header", textValue(fullName.isBlank() ? "Patient Doctorek" : fullName.trim()));
        // Marine "document officiel" — aligné sur le fond du hero et de la carte (#042651).
        genericObject.put("hexBackgroundColor", "#042651");
        // Google fetches the logo server-side: a non-public (e.g. localhost) URL breaks pass creation,
        // so dev/test falls back to a publicly reachable placeholder until a public domain is deployed.
        // TODO: switch to frontendUrl + "/icone-doctorek.png" once a public HTTPS domain is deployed
        // (Google fetches this image server-side; localhost/non-public URLs are rejected).
        String logoUri = frontendUrl.startsWith("https://")
                ? frontendUrl + "/icone-doctorek.png"
                : "https://files.catbox.moe/nxeqy6.png";
        genericObject.put("logo", Map.of("sourceUri", Map.of("uri", logoUri)));
        String heroImageUri = buildHeroImageUrl(cardRef, fullName.trim(), maskCin(numIdentite),
                orDash(assuranceNumero), photoUrl);
        if (heroImageUri != null) {
            genericObject.put("heroImage", Map.of("sourceUri", Map.of("uri", heroImageUri)));
        }
        // Direct image module: Google fetches it server-side, so only a publicly reachable URL
        // works (a social-login avatar). Manual uploads are data: URIs Google can't fetch — those
        // only appear via the server-rendered hero image above. Visible even on localhost.
        if (isPublicHttpUrl(photoUrl)) {
            genericObject.put("imageModulesData", List.of(Map.of(
                    "id", "patient_photo",
                    "mainImage", Map.of(
                            "sourceUri", Map.of("uri", photoUrl),
                            "contentDescription", textValue("Photo du patient"))
            )));
        }
        genericObject.put("textModulesData", List.of(
                Map.of("id", "cin", "header", "CIN", "body", maskCin(numIdentite)),
                Map.of("id", "cnss", "header", "N° CNSS / AMO", "body", orDash(assuranceNumero)),
                Map.of("id", "ref", "header", "N° Carte", "body", cardRef)
        ));
        genericObject.put("barcode", Map.of(
                "type", "QR_CODE",
                "value", qrUrl,
                "alternateText", cardRef
        ));

        Map<String, Object> payload = Map.of("genericObjects", List.of(genericObject));

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(clientEmail)
                .audience("google")
                .claim("typ", "savetowallet")
                .claim("origins", List.of())
                .issueTime(java.util.Date.from(Instant.now()))
                .claim("payload", payload)
                .build();

        try {
            SignedJWT signedJwt = new SignedJWT(
                    new JWSHeader.Builder(JWSAlgorithm.RS256).type(com.nimbusds.jose.JOSEObjectType.JWT).build(),
                    claims);
            signedJwt.sign(new RSASSASigner(privateKey));
            return "https://pay.google.com/gp/v/save/" + signedJwt.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Échec de la signature du pass Google Wallet", e);
        }
    }

    // Google Wallet re-télécharge l'image hero au save ET aux synchronisations
    // ultérieures — une URL à expiration courte casse la carte. 1 an.
    private static final long HERO_IMAGE_TTL_SECONDS = 365L * 24 * 3600;

    /**
     * Builds a cryptographically signed, short-lived URL to the frontend's hero-image
     * renderer so Google's servers can fetch a wallet hero matching the dashboard card's
     * look without exposing patient data through a permanent/guessable link.
     * Returns null when the frontend isn't on a public HTTPS domain yet (Google can't
     * reach localhost), so the pass falls back to its plain logo until a domain is deployed.
     */
    private String buildHeroImageUrl(String cardRef, String fullName, String maskedCin, String cnss,
                                     String photoUrl) {
        if (!frontendUrl.startsWith("https://")) {
            return null;
        }
        if (properties.getHeroSecret() == null || properties.getHeroSecret().isBlank()) {
            return null;
        }
        // Manual uploads are data: URIs — embedding one in the hero query string balloons the
        // save URL past Google's request-size limit (HTTP 400 on the save page). Only pass
        // publicly fetchable http(s) photos; the hero renders its silhouette placeholder otherwise.
        String photo = isPublicHttpUrl(photoUrl) ? photoUrl : "";
        String exp = String.valueOf(Instant.now().getEpochSecond() + HERO_IMAGE_TTL_SECONDS);
        // photo is part of the signed payload: it's patient data and the renderer must not accept
        // an arbitrary attacker-supplied image URL.
        String payload = String.join("|", cardRef, fullName, maskedCin, cnss, photo, exp);
        String sig = hmacSha256Hex(payload, properties.getHeroSecret());

        return frontendUrl + "/api/carte/wallet-hero"
                + "?cardRef=" + encode(cardRef)
                + "&fullName=" + encode(fullName)
                + "&maskedCin=" + encode(maskedCin)
                + "&cnss=" + encode(cnss)
                + "&photo=" + encode(photo)
                + "&exp=" + encode(exp)
                + "&sig=" + encode(sig);
    }

    private static boolean isPublicHttpUrl(String url) {
        if (url == null || url.isBlank()) return false;
        String lower = url.toLowerCase();
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) return false;
        // Google can't fetch loopback/private hosts.
        return !lower.contains("localhost") && !lower.contains("127.0.0.1");
    }

    private static String hmacSha256Hex(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Échec de la signature de l'image hero Google Wallet", e);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private synchronized void loadServiceAccountIfNeeded() {
        if (clientEmail != null && privateKey != null) {
            return;
        }
        if (properties.getServiceAccountPath() == null || properties.getServiceAccountPath().isBlank()) {
            throw new IllegalStateException("google.wallet.service-account-path n'est pas configuré");
        }
        Resource resource = resourceLoader.getResource(properties.getServiceAccountPath());
        try (InputStream in = resource.getInputStream()) {
            JsonNode root = MAPPER.readTree(in);
            this.clientEmail = root.get("client_email").asText();
            this.privateKey = parsePrivateKey(root.get("private_key").asText());
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de lire le fichier service account Google Wallet", e);
        }
    }

    private PrivateKey parsePrivateKey(String pem) {
        String cleaned = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] keyBytes = Base64.getDecoder().decode(cleaned);
        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return keyFactory.generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Clé privée du service account Google Wallet invalide", e);
        }
    }

    private static Map<String, Object> textValue(String value) {
        return Map.of("defaultValue", Map.of("language", "fr", "value", value));
    }

    private static String maskCin(String cin) {
        if (cin == null || cin.isBlank()) return "-";
        if (cin.length() < 3) return cin;
        return cin.charAt(0) + "*".repeat(cin.length() - 2) + cin.charAt(cin.length() - 1);
    }

    private static String orDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private static String sanitize(String value) {
        return value.replaceAll("[^A-Za-z0-9._-]", "-");
    }

    private static String nullToEmpty(String v) {
        return v == null ? "" : v;
    }

    /** Short content-derived id segment (8 hex chars) — stable for identical content. */
    private static String shortHash(String value) {
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < 4; i++) hex.append(String.format("%02x", digest[i]));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            return "0";
        }
    }
}
