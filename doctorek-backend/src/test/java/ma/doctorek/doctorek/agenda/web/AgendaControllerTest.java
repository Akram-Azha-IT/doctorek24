package ma.doctorek.doctorek.agenda.web;

import ma.doctorek.doctorek.agenda.application.DefineDisponibiliteUseCase;
import ma.doctorek.doctorek.agenda.application.GetCreneauxDisponiblesUseCase;
import ma.doctorek.doctorek.agenda.application.GetDisponibilitesUseCase;
import ma.doctorek.doctorek.agenda.domain.Creneau;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.MedecinSansAgendaException;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AgendaController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@DisplayName("AgendaController")
class AgendaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DefineDisponibiliteUseCase defineDisponibiliteUseCase;

    @MockBean
    private GetDisponibilitesUseCase getDisponibilitesUseCase;

    @MockBean
    private GetCreneauxDisponiblesUseCase getCreneauxDisponiblesUseCase;

    private final UUID medecinId = UUID.randomUUID();
    private final UUID dispoId   = UUID.randomUUID();

    @Nested
    @DisplayName("POST /api/v1/agenda/medecins/{medecinId}/disponibilites")
    class DefineDisponibilite {

        private final String validBody = """
            {
              "jourSemaine": "MONDAY",
              "heureDebut":  "09:00:00",
              "heureFin":    "17:00:00",
              "dureeConsultation": 30
            }
            """;

        @Test
        @DisplayName("returns 201 with created disponibilite")
        void returns201WithDisponibilite() throws Exception {
            Disponibilite dispo = new Disponibilite(
                dispoId, medecinId,
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0), LocalTime.of(17, 0), 30
            );
            when(defineDisponibiliteUseCase.execute(eq(medecinId), any()))
                .thenReturn(dispo);

            mockMvc.perform(post("/api/v1/agenda/medecins/" + medecinId + "/disponibilites")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(validBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(dispoId.toString()))
                .andExpect(jsonPath("$.data.jourSemaine").value("MONDAY"))
                .andExpect(jsonPath("$.data.heureDebut").value("09:00"))
                .andExpect(jsonPath("$.data.heureFin").value("17:00"))
                .andExpect(jsonPath("$.data.dureeConsultation").value(30));
        }

        @Test
        @DisplayName("returns 400 when jourSemaine is missing")
        void returns400WhenJourSemaineNull() throws Exception {
            String invalidBody = """
                {
                  "heureDebut": "09:00:00",
                  "heureFin":   "17:00:00",
                  "dureeConsultation": 30
                }
                """;

            mockMvc.perform(post("/api/v1/agenda/medecins/" + medecinId + "/disponibilites")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/agenda/medecins/{medecinId}/disponibilites")
    class GetDisponibilites {

        @Test
        @DisplayName("returns 200 with list of disponibilites")
        void returns200WithList() throws Exception {
            Disponibilite dispo = new Disponibilite(
                dispoId, medecinId,
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0), LocalTime.of(17, 0), 30
            );
            when(getDisponibilitesUseCase.execute(medecinId)).thenReturn(List.of(dispo));

            mockMvc.perform(get("/api/v1/agenda/medecins/" + medecinId + "/disponibilites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].jourSemaine").value("MONDAY"))
                .andExpect(jsonPath("$.data[0].dureeConsultation").value(30));
        }

        @Test
        @DisplayName("returns 200 with empty list when no disponibilites")
        void returns200WithEmptyList() throws Exception {
            when(getDisponibilitesUseCase.execute(medecinId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/agenda/medecins/" + medecinId + "/disponibilites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/agenda/medecins/{medecinId}/creneaux")
    class GetCreneaux {

        @Test
        @DisplayName("returns 200 with creneaux list")
        void returns200WithCreneaux() throws Exception {
            List<Creneau> creneaux = List.of(
                new Creneau(LocalTime.of(9, 0), LocalTime.of(10, 0), true),
                new Creneau(LocalTime.of(10, 0), LocalTime.of(11, 0), false)
            );
            when(getCreneauxDisponiblesUseCase.execute(eq(medecinId), eq(LocalDate.of(2026, 4, 13))))
                .thenReturn(creneaux);

            mockMvc.perform(get("/api/v1/agenda/medecins/" + medecinId + "/creneaux")
                    .param("date", "2026-04-13"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].debut").value("09:00"))
                .andExpect(jsonPath("$.data[0].disponible").value(true))
                .andExpect(jsonPath("$.data[1].disponible").value(false));
        }

        @Test
        @DisplayName("returns 404 when medecin has no agenda for that day")
        void returns404WhenNoAgenda() throws Exception {
            when(getCreneauxDisponiblesUseCase.execute(eq(medecinId), any()))
                .thenThrow(new MedecinSansAgendaException(medecinId));

            mockMvc.perform(get("/api/v1/agenda/medecins/" + medecinId + "/creneaux")
                    .param("date", "2026-04-13"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
        }
    }
}