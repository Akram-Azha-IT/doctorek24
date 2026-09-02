package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentTranscriptionResponse;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgentControllerTranscriptionTest {

    @Test
    void endpointResoutLePatientEtRetourneEnveloppeApi() {
        AgentService agentService = mock(AgentService.class);
        AgentTranscriptionService transcriptionService = mock(AgentTranscriptionService.class);
        UserRepository users = mock(UserRepository.class);
        AgentController controller = new AgentController(agentService, transcriptionService, users);
        Principal principal = () -> "patient@doctorek.ma";
        UUID patientId = UUID.randomUUID();
        User patient = mock(User.class);
        MockMultipartFile audio = new MockMultipartFile(
                "audio", "voix.webm", "audio/webm", new byte[]{1});

        when(patient.getId()).thenReturn(patientId);
        when(users.findByEmail(principal.getName())).thenReturn(Optional.of(patient));
        when(transcriptionService.transcrire(patientId, audio, 6.2))
                .thenReturn(new AgentTranscriptionResponse("bghit chi dentiste f Casa"));

        var response = controller.transcrire(principal, audio, 6.2);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data().transcription()).contains("dentiste");
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        verify(transcriptionService).transcrire(patientId, audio, 6.2);
    }
}
