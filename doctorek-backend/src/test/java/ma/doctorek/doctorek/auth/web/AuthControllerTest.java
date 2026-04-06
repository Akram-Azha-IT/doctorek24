package ma.doctorek.doctorek.auth.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.auth.application.RegisterPatientUseCase;
import ma.doctorek.doctorek.auth.application.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.auth.domain.EmailAlreadyExistsException;
import ma.doctorek.doctorek.auth.domain.PhoneAlreadyExistsException;
import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.infrastructure.SecurityConfig;
import ma.doctorek.doctorek.shared.web.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@DisplayName("POST /api/v1/auth/register/patient")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RegisterPatientUseCase registerPatientUseCase;

    private static final PatientRegisteredResponse MOCK_RESPONSE = new PatientRegisteredResponse(
        UUID.randomUUID(),
        "alice@example.com",
        "+212612345678",
        "Alice",
        "Dupont",
        Role.PATIENT,
        "fr",
        Instant.now()
    );

    @Test
    @DisplayName("valid request → 201 Created with patient data")
    void register_withValidRequest_returns201() throws Exception {
        when(registerPatientUseCase.execute(any())).thenReturn(MOCK_RESPONSE);

        mockMvc.perform(post("/api/v1/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.email").value("alice@example.com"))
            .andExpect(jsonPath("$.data.role").value("PATIENT"))
            .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    @DisplayName("invalid email → 400 Bad Request")
    void register_withInvalidEmail_returns400() throws Exception {
        String body = """
            {
              "email": "not-an-email",
              "phone": "0612345678",
              "password": "password123",
              "firstName": "Alice",
              "lastName": "Dupont"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("invalid Moroccan phone → 400 Bad Request")
    void register_withInvalidPhone_returns400() throws Exception {
        String body = """
            {
              "email": "alice@example.com",
              "phone": "0512345678",
              "password": "password123",
              "firstName": "Alice",
              "lastName": "Dupont"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("duplicate email → 409 Conflict")
    void register_withExistingEmail_returns409() throws Exception {
        when(registerPatientUseCase.execute(any()))
            .thenThrow(new EmailAlreadyExistsException("alice@example.com"));

        mockMvc.perform(post("/api/v1/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson()))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Email already registered: alice@example.com"));
    }

    @Test
    @DisplayName("duplicate phone → 409 Conflict")
    void register_withExistingPhone_returns409() throws Exception {
        when(registerPatientUseCase.execute(any()))
            .thenThrow(new PhoneAlreadyExistsException("+212612345678"));

        mockMvc.perform(post("/api/v1/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson()))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.success").value(false));
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private String validRequestJson() {
        return """
            {
              "email": "alice@example.com",
              "phone": "0612345678",
              "password": "password123",
              "firstName": "Alice",
              "lastName": "Dupont",
              "lang": "fr"
            }
            """;
    }
}
