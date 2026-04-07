package ma.doctorek.doctorek.auth.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.auth.application.RegisterMedecinUseCase;
import ma.doctorek.doctorek.auth.application.RegisterPatientUseCase;
import ma.doctorek.doctorek.auth.application.dto.MedecinRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.auth.domain.EmailAlreadyExistsException;
import ma.doctorek.doctorek.auth.domain.InpeAlreadyExistsException;
import ma.doctorek.doctorek.auth.domain.PhoneAlreadyExistsException;
import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.infrastructure.SecurityConfig;
import ma.doctorek.doctorek.shared.web.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RegisterPatientUseCase registerPatientUseCase;

    @MockBean
    private RegisterMedecinUseCase registerMedecinUseCase;

    private static final PatientRegisteredResponse MOCK_PATIENT_RESPONSE = new PatientRegisteredResponse(
        UUID.randomUUID(),
        "alice@example.com",
        "+212612345678",
        "Alice",
        "Dupont",
        Role.PATIENT,
        "fr",
        Instant.now()
    );

    private static final MedecinRegisteredResponse MOCK_MEDECIN_RESPONSE = new MedecinRegisteredResponse(
        UUID.randomUUID(),
        "dr.hassan@example.com",
        "+212661234567",
        "Hassan",
        "Alaoui",
        "1234567890",
        "Cardiologie",
        "Casablanca",
        Role.MEDECIN,
        "fr",
        Instant.now()
    );

    // ── Patient ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/auth/register/patient")
    class RegisterPatient {

        @Test
        @DisplayName("valid request → 201 Created with patient data")
        void register_withValidRequest_returns201() throws Exception {
            when(registerPatientUseCase.execute(any())).thenReturn(MOCK_PATIENT_RESPONSE);

            mockMvc.perform(post("/api/v1/auth/register/patient")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(validPatientJson()))
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
                    .content(validPatientJson()))
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
                    .content(validPatientJson()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
        }
    }

    // ── Médecin ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/auth/register/medecin")
    class RegisterMedecin {

        @Test
        @DisplayName("valid request → 201 Created with médecin data")
        void register_withValidRequest_returns201() throws Exception {
            when(registerMedecinUseCase.execute(any())).thenReturn(MOCK_MEDECIN_RESPONSE);

            mockMvc.perform(post("/api/v1/auth/register/medecin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(validMedecinJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("dr.hassan@example.com"))
                .andExpect(jsonPath("$.data.role").value("MEDECIN"))
                .andExpect(jsonPath("$.data.inpe").value("1234567890"))
                .andExpect(jsonPath("$.data.specialite").value("Cardiologie"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
        }

        @Test
        @DisplayName("invalid INPE format → 400 Bad Request")
        void register_withInvalidInpe_returns400() throws Exception {
            String body = """
                {
                  "email": "dr.hassan@example.com",
                  "phone": "0661234567",
                  "password": "password123",
                  "firstName": "Hassan",
                  "lastName": "Alaoui",
                  "inpe": "INPE-INVALID",
                  "specialite": "Cardiologie",
                  "ville": "Casablanca"
                }
                """;

            mockMvc.perform(post("/api/v1/auth/register/medecin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("duplicate email → 409 Conflict")
        void register_withExistingEmail_returns409() throws Exception {
            when(registerMedecinUseCase.execute(any()))
                .thenThrow(new EmailAlreadyExistsException("dr.hassan@example.com"));

            mockMvc.perform(post("/api/v1/auth/register/medecin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(validMedecinJson()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("duplicate INPE → 409 Conflict")
        void register_withExistingInpe_returns409() throws Exception {
            when(registerMedecinUseCase.execute(any()))
                .thenThrow(new InpeAlreadyExistsException("1234567890"));

            mockMvc.perform(post("/api/v1/auth/register/medecin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(validMedecinJson()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("INPE already registered: 1234567890"));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String validPatientJson() {
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

    private String validMedecinJson() {
        return """
            {
              "email": "dr.hassan@example.com",
              "phone": "0661234567",
              "password": "password123",
              "firstName": "Hassan",
              "lastName": "Alaoui",
              "inpe": "1234567890",
              "specialite": "Cardiologie",
              "ville": "Casablanca",
              "adresse": "Rue des Fleurs 10",
              "lang": "fr"
            }
            """;
    }
}
