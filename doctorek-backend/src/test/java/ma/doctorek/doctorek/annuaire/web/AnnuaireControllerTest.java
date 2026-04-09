package ma.doctorek.doctorek.annuaire.web;

import ma.doctorek.doctorek.annuaire.application.GetMedecinProfileUseCase;
import ma.doctorek.doctorek.annuaire.application.SearchMedecinsUseCase;
import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.auth.infrastructure.SecurityConfig;
import ma.doctorek.doctorek.shared.web.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import ma.doctorek.doctorek.annuaire.application.UpdateMedecinProfileUseCase;
import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;
import org.springframework.http.MediaType;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnnuaireController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@DisplayName("AnnuaireController")
class AnnuaireControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GetMedecinProfileUseCase getMedecinProfileUseCase;

    @MockBean
    private SearchMedecinsUseCase searchMedecinsUseCase;

    @MockBean
    private UpdateMedecinProfileUseCase updateMedecinProfileUseCase;

    private final UUID existingId = UUID.randomUUID();

    @Nested
    @DisplayName("Profil trouvé")
    class WhenFound {

        @Test
        @DisplayName("returns 200 with medecin profile")
        void returns200WithProfile() throws Exception {
            MedecinProfile profile = new MedecinProfile(
                existingId, "Youssef", "Bakkali", "Cardiologie", "Casablanca", "123 Rue Hassan II", "1234567890"
            );
            when(getMedecinProfileUseCase.execute(existingId)).thenReturn(profile);

            mockMvc.perform(get("/api/v1/annuaire/medecins/" + existingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("Youssef"))
                .andExpect(jsonPath("$.data.lastName").value("Bakkali"))
                .andExpect(jsonPath("$.data.specialite").value("Cardiologie"))
                .andExpect(jsonPath("$.data.ville").value("Casablanca"))
                .andExpect(jsonPath("$.data.inpe").value("1234567890"))
                .andExpect(jsonPath("$.data.id").value(existingId.toString()));
        }
    }

    @Nested
    @DisplayName("Profil non trouvé")
    class WhenNotFound {

        @Test
        @DisplayName("returns 404 when id does not match any medecin")
        void returns404() throws Exception {
            UUID unknownId = UUID.randomUUID();
            when(getMedecinProfileUseCase.execute(unknownId))
                .thenThrow(new MedecinNotFoundException(unknownId));

            mockMvc.perform(get("/api/v1/annuaire/medecins/" + unknownId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/annuaire/medecins?specialite=X&ville=Y")
    class Search {

        @Test
        @DisplayName("returns 200 with matching medecins")
        void returns200WithResults() throws Exception {
            MedecinProfile profile = new MedecinProfile(
                UUID.randomUUID(), "Hassan", "Alaoui", "Cardiologie", "Casablanca", "Rue 10", "1234567890"
            );
            when(searchMedecinsUseCase.execute("Cardiologie", "Casablanca"))
                .thenReturn(List.of(profile));

            mockMvc.perform(get("/api/v1/annuaire/medecins")
                    .param("specialite", "Cardiologie")
                    .param("ville", "Casablanca"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].specialite").value("Cardiologie"))
                .andExpect(jsonPath("$.data[0].ville").value("Casablanca"))
                .andExpect(jsonPath("$.data[0].firstName").value("Hassan"));
        }

        @Test
        @DisplayName("returns 200 with empty list when no match")
        void returns200WithEmptyList() throws Exception {
            when(searchMedecinsUseCase.execute("Neurologie", "Agadir"))
                .thenReturn(List.of());

            mockMvc.perform(get("/api/v1/annuaire/medecins")
                    .param("specialite", "Neurologie")
                    .param("ville", "Agadir"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/annuaire/medecins/{id}")
    class Update {

        private final String validBody = """
            {
              "firstName": "Hassan",
              "lastName": "Alaoui",
              "phone": "+212600000001",
              "specialite": "Cardiologie",
              "ville": "Casablanca",
              "adresse": "Rue 10",
              "lang": "fr"
            }
            """;

        @Test
        @DisplayName("returns 200 with updated profile")
        void returns200WithUpdatedProfile() throws Exception {
            MedecinProfile updated = new MedecinProfile(
                existingId, "Hassan", "Alaoui", "Cardiologie", "Casablanca", "Rue 10", "1234567890"
            );
            when(updateMedecinProfileUseCase.execute(eq(existingId), any(UpdateMedecinProfileRequest.class)))
                .thenReturn(updated);

            mockMvc.perform(put("/api/v1/annuaire/medecins/" + existingId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(validBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("Hassan"))
                .andExpect(jsonPath("$.data.specialite").value("Cardiologie"));
        }

        @Test
        @DisplayName("returns 404 when medecin not found")
        void returns404WhenMedecinNotFound() throws Exception {
            UUID unknownId = UUID.randomUUID();
            when(updateMedecinProfileUseCase.execute(eq(unknownId), any(UpdateMedecinProfileRequest.class)))
                .thenThrow(new MedecinNotFoundException(unknownId));

            mockMvc.perform(put("/api/v1/annuaire/medecins/" + unknownId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(validBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("returns 400 when firstName is blank")
        void returns400WhenFirstNameBlank() throws Exception {
            String invalidBody = """
                {
                  "firstName": "",
                  "lastName": "Alaoui",
                  "specialite": "Cardiologie",
                  "ville": "Casablanca"
                }
                """;

            mockMvc.perform(put("/api/v1/annuaire/medecins/" + existingId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidBody))
                .andExpect(status().isBadRequest());
        }
    }
}
