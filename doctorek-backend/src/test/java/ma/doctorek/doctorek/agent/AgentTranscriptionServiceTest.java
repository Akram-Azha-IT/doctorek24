package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.exception.AgentFournisseurException;
import ma.doctorek.doctorek.exception.AgentIndisponibleException;
import ma.doctorek.doctorek.service.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgentTranscriptionServiceTest {

    @Mock AgentTranscriptionClient client;
    @Mock RateLimiterService rateLimiter;

    private AgentTranscriptionProperties properties;
    private AgentTranscriptionService service;
    private final UUID patientId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        properties = new AgentTranscriptionProperties();
        properties.setEnabled(true);
        properties.setApiKey("test-key");
        service = new AgentTranscriptionService(client, properties, rateLimiter);
    }

    @Test
    void audioValide_estTranscritSansEnvoiAutomatiqueAuChat() throws Exception {
        MockMultipartFile audio = audio("audio/webm; codecs=opus", new byte[]{1, 2, 3});
        when(client.transcrire(audio.getBytes(), "audio/webm"))
                .thenReturn("Salam 3alaykom, bghit chi dentiste f Casa");

        var response = service.transcrire(patientId, audio, 6.1);

        assertThat(response.transcription()).contains("dentiste", "Casa");
        verify(rateLimiter).checkAndIncrement("agent-transcription", patientId,
                properties.getQuotaRequests(), properties.getQuotaWindow());
    }

    @Test
    void configurationAbsente_repondIndisponible() {
        properties.setApiKey("");

        assertThatThrownBy(() -> service.transcrire(patientId, audio("audio/webm", new byte[]{1}), 1.0))
                .isInstanceOf(AgentIndisponibleException.class);
        verify(client, never()).transcrire(any(), any());
    }

    @Test
    void fichierVide_estRejeteAvantGemini() {
        assertThatThrownBy(() -> service.transcrire(patientId, audio("audio/webm", new byte[0]), 1.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vide");
        verify(client, never()).transcrire(any(), any());
    }

    @Test
    void formatNonAudio_estRejeteAvantGemini() {
        assertThatThrownBy(() -> service.transcrire(patientId, audio("application/zip", new byte[]{1}), 1.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("format");
        verify(client, never()).transcrire(any(), any());
    }

    @Test
    void fichierTropVolumineux_estRejeteAvantGemini() {
        properties.setMaxBytes(2);

        assertThatThrownBy(() -> service.transcrire(patientId, audio("audio/webm", new byte[3]), 1.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("volumineux");
        verify(client, never()).transcrire(any(), any());
    }

    @Test
    void erreurGemini_devient503SansExposerLeFournisseur() {
        MockMultipartFile audio = audio("audio/webm", new byte[]{1});
        when(client.transcrire(any(), eq("audio/webm")))
                .thenThrow(new IllegalStateException("quota Gemini détaillé"));

        assertThatThrownBy(() -> service.transcrire(patientId, audio, 1.0))
                .isInstanceOf(AgentFournisseurException.class)
                .hasMessageNotContaining("quota Gemini");
    }

    @Test
    void dureeSuperieureATrenteSecondes_estRejeteeAvantGemini() {
        assertThatThrownBy(() -> service.transcrire(
                patientId, audio("audio/webm", new byte[]{1}), 31.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("30 secondes");
        verify(client, never()).transcrire(any(), any());
    }

    @Test
    void transcriptionTropLongue_estBorneeAuContratDuChat() {
        MockMultipartFile audio = audio("audio/webm", new byte[]{1});
        when(client.transcrire(any(), eq("audio/webm"))).thenReturn("a".repeat(700));

        var response = service.transcrire(patientId, audio, 1.0);

        assertThat(response.transcription()).hasSize(500);
    }

    private static MockMultipartFile audio(String mime, byte[] contenu) {
        return new MockMultipartFile("audio", "dictée.webm", mime, contenu);
    }
}
