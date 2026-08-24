package ma.doctorek.doctorek.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GoogleWalletClassServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void synchronizesOneRowCardTemplateAndCachesTheResult() throws Exception {
        HttpClient client = mock(HttpClient.class);
        HttpResponse<String> tokenResponse = response(200,
                "{\"access_token\":\"token-123\",\"expires_in\":3600}");
        HttpResponse<String> patchResponse = response(200, "{}");
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenReturn(tokenResponse, patchResponse);

        GoogleWalletClassService service = new GoogleWalletClassService(
                client,
                MAPPER,
                Clock.fixed(Instant.parse("2026-08-24T13:00:00Z"), ZoneOffset.UTC)
        );

        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();

        service.ensurePremiumTemplate("wallet@doctorek.test", keyPair.getPrivate(), "issuer.carte-sante");
        service.ensurePremiumTemplate("wallet@doctorek.test", keyPair.getPrivate(), "issuer.carte-sante");

        var requests = org.mockito.ArgumentCaptor.forClass(HttpRequest.class);
        verify(client, times(2)).send(requests.capture(), any(HttpResponse.BodyHandler.class));
        List<HttpRequest> sent = requests.getAllValues();
        assertEquals(URI.create("https://oauth2.googleapis.com/token"), sent.get(0).uri());
        assertEquals("POST", sent.get(0).method());
        assertEquals("PATCH", sent.get(1).method());
        assertEquals(
                URI.create("https://walletobjects.googleapis.com/walletobjects/v1/genericClass/issuer.carte-sante"),
                sent.get(1).uri()
        );

        JsonNode payload = MAPPER.readTree(body(sent.get(1)));
        JsonNode rows = payload.path("classTemplateInfo")
                .path("cardTemplateOverride")
                .path("cardRowTemplateInfos");
        assertEquals(1, rows.size());
        assertEquals(
                "object.textModulesData['member']",
                rows.get(0).path("twoItems").path("startItem")
                        .path("firstValue").path("fields").get(0).path("fieldPath").asText()
        );
        assertEquals(
                "object.textModulesData['status']",
                rows.get(0).path("twoItems").path("endItem")
                        .path("firstValue").path("fields").get(0).path("fieldPath").asText()
        );
    }

    @Test
    void createsTheClassWhenItDoesNotExist() throws Exception {
        HttpClient client = mock(HttpClient.class);
        HttpResponse<String> tokenResponse = response(200,
                "{\"access_token\":\"token-123\",\"expires_in\":3600}");
        HttpResponse<String> notFoundResponse = response(404, "{}");
        HttpResponse<String> insertResponse = response(200, "{}");
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenReturn(tokenResponse, notFoundResponse, insertResponse);
        GoogleWalletClassService service = new GoogleWalletClassService(
                client,
                MAPPER,
                Clock.fixed(Instant.parse("2026-08-24T13:00:00Z"), ZoneOffset.UTC)
        );

        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        service.ensurePremiumTemplate(
                "wallet@doctorek.test",
                generator.generateKeyPair().getPrivate(),
                "issuer.carte-sante-v4"
        );

        var requests = org.mockito.ArgumentCaptor.forClass(HttpRequest.class);
        verify(client, times(3)).send(requests.capture(), any(HttpResponse.BodyHandler.class));
        assertEquals("POST", requests.getAllValues().get(2).method());
        assertEquals(
                URI.create("https://walletobjects.googleapis.com/walletobjects/v1/genericClass"),
                requests.getAllValues().get(2).uri()
        );
    }

    @SuppressWarnings("unchecked")
    private static HttpResponse<String> response(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        return response;
    }

    private static String body(HttpRequest request) throws Exception {
        HttpRequest.BodyPublisher publisher = request.bodyPublisher().orElseThrow();
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        publisher.subscribe(new java.util.concurrent.Flow.Subscriber<>() {
            @Override
            public void onSubscribe(java.util.concurrent.Flow.Subscription subscription) {
                subscription.request(Long.MAX_VALUE);
            }

            @Override
            public void onNext(java.nio.ByteBuffer item) {
                byte[] bytes = new byte[item.remaining()];
                item.get(bytes);
                output.writeBytes(bytes);
            }

            @Override
            public void onError(Throwable throwable) {
                throw new AssertionError(throwable);
            }

            @Override
            public void onComplete() {
                // no-op
            }
        });
        String value = output.toString(java.nio.charset.StandardCharsets.UTF_8);
        assertTrue(!value.isBlank());
        return value;
    }
}
