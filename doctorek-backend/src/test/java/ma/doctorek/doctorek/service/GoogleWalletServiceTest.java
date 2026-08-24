package ma.doctorek.doctorek.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jwt.SignedJWT;
import ma.doctorek.doctorek.config.GoogleWalletProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.DefaultResourceLoader;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GoogleWalletServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @TempDir
    Path tempDir;

    @Test
    void buildSaveUrlUsesGlobalCareDesignWithoutSensitiveModules() throws Exception {
        GoogleWalletProperties properties = new GoogleWalletProperties();
        properties.setEnabled(true);
        properties.setIssuerId("issuer-123");
        properties.setClassId("carte-sante");
        properties.setServiceAccountPath(writeServiceAccount().toUri().toString());

        GoogleWalletService service = new GoogleWalletService(
                properties,
                new DefaultResourceLoader(),
                "https://doctorek.ma"
        );

        String saveUrl = service.buildSaveUrl(
                "VMC-2026-00DA4AFC",
                "Akram",
                "Benhammou",
                "AB123456",
                "99887766",
                "https://images.example/patient.jpg"
        );

        Map<String, Object> walletObject = walletObjectFrom(saveUrl);

        assertEquals("GENERIC_OTHER", walletObject.get("genericType"));
        assertEquals("#216ACF", walletObject.get("hexBackgroundColor"));
        assertEquals("Carte santé", localizedValue(walletObject.get("subheader")));
        assertEquals("Akram BENHAMMOU", localizedValue(walletObject.get("header")));
        assertEquals(
                "https://doctorek.ma/wallet-logo-840.png",
                nestedUri(walletObject.get("logo"))
        );
        assertEquals(
                "https://doctorek.ma/wallet-hero-global-care.png",
                nestedUri(walletObject.get("heroImage"))
        );

        List<Map<String, Object>> modules = castList(walletObject.get("textModulesData"));
        assertEquals("00DA4AFC", moduleBody(modules, "member"));
        assertEquals("Active", moduleBody(modules, "status"));
        assertEquals("AMO / CNSS", moduleBody(modules, "coverage"));
        assertFalse(walletObject.containsKey("imageModulesData"));

        String serialized = MAPPER.writeValueAsString(walletObject);
        assertFalse(serialized.contains("AB123456"));
        assertFalse(serialized.contains("99887766"));
        assertFalse(serialized.contains("patient.jpg"));
        assertTrue(serialized.contains("Ouvrir Doctorek"));
        assertTrue(serialized.contains("/dashboard/patient/carte"));
    }

    private Path writeServiceAccount() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        String privateKey = Base64.getMimeEncoder(64, new byte[]{'\n'})
                .encodeToString(keyPair.getPrivate().getEncoded());
        String pem = "-----BEGIN PRIVATE KEY-----\n" + privateKey
                + "\n-----END PRIVATE KEY-----\n";

        Path file = tempDir.resolve("wallet-service-account.json");
        MAPPER.writeValue(file.toFile(), Map.of(
                "client_email", "wallet-test@doctorek.test",
                "private_key", pem
        ));
        assertTrue(Files.exists(file));
        return file;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> walletObjectFrom(String saveUrl) throws Exception {
        String token = saveUrl.substring(saveUrl.lastIndexOf('/') + 1);
        Map<String, Object> payload = (Map<String, Object>) SignedJWT.parse(token)
                .getJWTClaimsSet()
                .getClaim("payload");
        return ((List<Map<String, Object>>) payload.get("genericObjects")).get(0);
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> castList(Object value) {
        return (List<Map<String, Object>>) value;
    }

    @SuppressWarnings("unchecked")
    private static String localizedValue(Object value) {
        Map<String, Object> localized = (Map<String, Object>) value;
        Map<String, Object> defaultValue = (Map<String, Object>) localized.get("defaultValue");
        return String.valueOf(defaultValue.get("value"));
    }

    @SuppressWarnings("unchecked")
    private static String nestedUri(Object value) {
        Map<String, Object> image = (Map<String, Object>) value;
        Map<String, Object> sourceUri = (Map<String, Object>) image.get("sourceUri");
        return String.valueOf(sourceUri.get("uri"));
    }

    private static String moduleBody(List<Map<String, Object>> modules, String id) {
        return modules.stream()
                .filter(module -> id.equals(module.get("id")))
                .map(module -> String.valueOf(module.get("body")))
                .findFirst()
                .orElseThrow();
    }
}
