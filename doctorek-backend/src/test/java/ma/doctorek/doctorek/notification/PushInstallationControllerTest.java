package ma.doctorek.doctorek.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PushInstallationControllerTest {
    private final PushInstallationService service = mock(PushInstallationService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new PushInstallationController(service, users)).build();
    private final ObjectMapper json = new ObjectMapper();
    private final UUID userId = UUID.randomUUID();

    @Test
    void registerUsesAuthenticatedPrincipalInsteadOfRequestIdentity() throws Exception {
        UUID installationId = UUID.randomUUID();
        when(users.findByEmail("patient@test.ma")).thenReturn(Optional.of(User.builder().id(userId).build()));
        mvc.perform(put("/api/v1/push/installations")
                        .principal(() -> "patient@test.ma")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new PushRegistrationRequest(
                                installationId, "ANDROID", "DEVELOPMENT", "a".repeat(64)))))
                .andExpect(status().isOk());
        verify(service).register(eq(userId), argThat(request -> request.installationId().equals(installationId)));
    }

    @Test
    void unregisterCanOnlyTargetCurrentAuthenticatedAccount() throws Exception {
        UUID installationId = UUID.randomUUID();
        when(users.findByEmail("patient@test.ma")).thenReturn(Optional.of(User.builder().id(userId).build()));
        mvc.perform(delete("/api/v1/push/installations/{id}", installationId)
                        .principal(() -> "patient@test.ma"))
                .andExpect(status().isOk());
        verify(service).unregister(userId, installationId);
    }

    @Test
    void rejectsUnsupportedPlatform() throws Exception {
        when(users.findByEmail("patient@test.ma")).thenReturn(Optional.of(User.builder().id(userId).build()));
        mvc.perform(put("/api/v1/push/installations")
                        .principal(() -> "patient@test.ma")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"installationId\":\"" + UUID.randomUUID() + "\",\"platform\":\"WEB\",\"environment\":\"DEVELOPMENT\",\"token\":\"" + "a".repeat(64) + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
