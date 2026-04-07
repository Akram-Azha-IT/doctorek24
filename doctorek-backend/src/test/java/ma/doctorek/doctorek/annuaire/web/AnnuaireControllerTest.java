package ma.doctorek.doctorek.annuaire.web;

import ma.doctorek.doctorek.annuaire.application.GetMedecinProfileUseCase;
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

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnnuaireController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@DisplayName("GET /api/v1/annuaire/medecins/{id}")
class AnnuaireControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GetMedecinProfileUseCase getMedecinProfileUseCase;

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
}
