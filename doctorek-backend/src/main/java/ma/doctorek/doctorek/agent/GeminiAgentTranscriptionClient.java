package ma.doctorek.doctorek.agent;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/** Client HTTP minimal vers Gemini Transcribe ; le fichier distant est supprimé après usage. */
@Component
public class GeminiAgentTranscriptionClient implements AgentTranscriptionClient {

    private static final String BASE_URL = "https://generativelanguage.googleapis.com";
    private static final Logger log = LoggerFactory.getLogger(GeminiAgentTranscriptionClient.class);

    private final AgentTranscriptionProperties properties;
    private final RestClient restClient;

    @Autowired
    public GeminiAgentTranscriptionClient(AgentTranscriptionProperties properties,
                                          RestClient.Builder restClientBuilder) {
        this(properties, configuredClient(properties, restClientBuilder));
    }

    GeminiAgentTranscriptionClient(AgentTranscriptionProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    private static RestClient configuredClient(AgentTranscriptionProperties properties,
                                               RestClient.Builder builder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.getConnectTimeout());
        requestFactory.setReadTimeout(properties.getReadTimeout());
        return builder
                .baseUrl(BASE_URL)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public String transcrire(byte[] audio, String mimeType) {
        GeminiFile fichier = televerser(audio, mimeType);
        try {
            Map<String, Object> body = Map.of(
                    "model", properties.getModel(),
                    "input", List.of(Map.of(
                            "type", "audio",
                            "uri", fichier.uri(),
                            "mime_type", mimeType)),
                    "generation_config", Map.of(
                            "transcription_config", Map.of(
                                    "language_codes", List.of(),
                                    "custom_vocabulary", properties.getCustomVocabulary(),
                                    "mode", Map.of("type", "verbatim"))));

            JsonNode response = restClient.post()
                    .uri("/v1beta/interactions")
                    .header("x-goog-api-key", properties.getApiKey())
                    .header("Api-Revision", "2026-05-20")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return extraireTexte(response);
        } finally {
            supprimer(fichier.name());
        }
    }

    private GeminiFile televerser(byte[] audio, String mimeType) {
        ResponseEntity<Void> initialisation = restClient.post()
                .uri("/upload/v1beta/files")
                .header("x-goog-api-key", properties.getApiKey())
                .header("X-Goog-Upload-Protocol", "resumable")
                .header("X-Goog-Upload-Command", "start")
                .header("X-Goog-Upload-Header-Content-Length", String.valueOf(audio.length))
                .header("X-Goog-Upload-Header-Content-Type", mimeType)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("file", Map.of("displayName", "doctorek-dictee")))
                .retrieve()
                .toBodilessEntity();

        String uploadUrl = initialisation.getHeaders().getFirst("X-Goog-Upload-URL");
        if (uploadUrl == null || uploadUrl.isBlank()) {
            throw new IllegalStateException("Gemini n'a pas fourni d'URL de téléversement");
        }

        JsonNode response = restClient.post()
                .uri(uploadUrl)
                .header("X-Goog-Upload-Offset", "0")
                .header("X-Goog-Upload-Command", "upload, finalize")
                .contentType(MediaType.parseMediaType(mimeType))
                .contentLength(audio.length)
                .body(audio)
                .retrieve()
                .body(JsonNode.class);

        String name = response == null ? "" : response.at("/file/name").asText("");
        String uri = response == null ? "" : response.at("/file/uri").asText("");
        if (!name.startsWith("files/") || uri.isBlank()) {
            throw new IllegalStateException("Réponse de téléversement Gemini invalide");
        }
        return new GeminiFile(name, uri);
    }

    private String extraireTexte(JsonNode response) {

        if (response == null) {
            throw new IllegalStateException("Réponse Gemini vide");
        }
        String text = response.path("output_text").asText("").trim();
        if (text.isBlank()) {
            text = StreamSupport.stream(response.path("steps").spliterator(), false)
                    .flatMap(step -> StreamSupport.stream(step.path("content").spliterator(), false))
                    .map(content -> content.path("text").asText("").trim())
                    .filter(content -> !content.isBlank())
                    .collect(Collectors.joining("\n"));
        }
        if (text.isBlank()) {
            text = StreamSupport.stream(response.path("outputs").spliterator(), false)
                    .map(output -> output.path("text").asText("").trim())
                    .filter(output -> !output.isBlank())
                    .collect(Collectors.joining("\n"));
        }
        if (text.isBlank()) {
            String stepTypes = StreamSupport.stream(response.path("steps").spliterator(), false)
                    .map(step -> step.path("type").asText("absent"))
                    .collect(Collectors.joining(","));
            String outputTypes = StreamSupport.stream(response.path("outputs").spliterator(), false)
                    .map(output -> output.path("type").asText("absent"))
                    .collect(Collectors.joining(","));
            log.warn("gemini_transcription_sans_texte status={} stepTypes={} outputTypes={}",
                    response.path("status").asText("absent"), stepTypes, outputTypes);
            throw new IllegalStateException("Gemini n'a produit aucune transcription");
        }
        return text;
    }

    private void supprimer(String name) {
        String identifiant = name.substring("files/".length());
        try {
            restClient.delete()
                    .uri("/v1beta/files/{identifiant}", identifiant)
                    .header("x-goog-api-key", properties.getApiKey())
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException exception) {
            log.warn("gemini_transcription_suppression_fichier_echec type={}",
                    exception.getClass().getSimpleName());
        }
    }

    private record GeminiFile(String name, String uri) {}
}
