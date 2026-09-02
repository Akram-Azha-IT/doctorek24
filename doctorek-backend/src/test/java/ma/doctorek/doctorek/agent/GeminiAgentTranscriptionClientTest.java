package ma.doctorek.doctorek.agent;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeminiAgentTranscriptionClientTest {

    @Test
    void springSelectionneLeConstructeurAvecRestClientBuilder() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(AgentTranscriptionProperties.class);
            context.registerBean(RestClient.Builder.class, () -> RestClient.builder());
            context.register(GeminiAgentTranscriptionClient.class);

            context.refresh();

            assertThat(context.getBean(GeminiAgentTranscriptionClient.class)).isNotNull();
        }
    }

    @Test
    void televerseAudioAvecVocabulaireExtraitLeTextePuisSupprimeLeFichier() {
        AgentTranscriptionProperties properties = new AgentTranscriptionProperties();
        properties.setApiKey("secret-test");
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GeminiAgentTranscriptionClient client =
                new GeminiAgentTranscriptionClient(properties,
                        builder.baseUrl("https://generativelanguage.googleapis.com").build());

        server.expect(once(), requestTo("https://generativelanguage.googleapis.com/upload/v1beta/files"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "secret-test"))
                .andExpect(header("X-Goog-Upload-Protocol", "resumable"))
                .andExpect(header("X-Goog-Upload-Header-Content-Type", "audio/wav"))
                .andRespond(withSuccess()
                        .header("X-Goog-Upload-URL", "https://generativelanguage.googleapis.com/upload/session-test"));

        server.expect(once(), requestTo("https://generativelanguage.googleapis.com/upload/session-test"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Goog-Upload-Command", "upload, finalize"))
                .andExpect(content().bytes(new byte[]{1, 2, 3}))
                .andRespond(withSuccess("""
                        {"file":{"name":"files/audio-test","uri":"https://generativelanguage.googleapis.com/v1beta/files/audio-test"}}
                        """, MediaType.APPLICATION_JSON));

        server.expect(once(), requestTo("https://generativelanguage.googleapis.com/v1beta/interactions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "secret-test"))
                .andExpect(header("Api-Revision", "2026-05-20"))
                .andExpect(jsonPath("$.model").value("gemini-3.5-transcribe"))
                .andExpect(jsonPath("$.input[0].type").value("audio"))
                .andExpect(jsonPath("$.input[0].mime_type")
                        .value("audio/wav"))
                .andExpect(jsonPath("$.input[0].uri")
                        .value("https://generativelanguage.googleapis.com/v1beta/files/audio-test"))
                .andExpect(jsonPath("$.generation_config.transcription_config.mode.type")
                        .value("verbatim"))
                .andExpect(jsonPath("$.generation_config.transcription_config.custom_vocabulary")
                        .isArray())
                .andRespond(withSuccess("""
                        {"id":"int_test","status":"completed","steps":[
                          {"type":"model_output","content":[
                            {"type":"text","text":"Salam 3alaykom, bghit chi dentiste f Casa"}
                          ]}
                        ]}
                        """, MediaType.APPLICATION_JSON));

        server.expect(once(), requestTo("https://generativelanguage.googleapis.com/v1beta/files/audio-test"))
                .andExpect(method(HttpMethod.DELETE))
                .andExpect(header("x-goog-api-key", "secret-test"))
                .andRespond(withSuccess());

        String result = client.transcrire(new byte[]{1, 2, 3}, "audio/wav");

        assertThat(result).isEqualTo("Salam 3alaykom, bghit chi dentiste f Casa");
        server.verify();
    }
}
