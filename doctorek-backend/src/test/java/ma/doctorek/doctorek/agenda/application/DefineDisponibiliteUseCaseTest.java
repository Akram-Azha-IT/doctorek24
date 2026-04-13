package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.application.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DefineDisponibiliteUseCase")
class DefineDisponibiliteUseCaseTest {

    @Mock
    private DisponibiliteRepository repo;

    private DefineDisponibiliteUseCase useCase;

    private final UUID medecinId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new DefineDisponibiliteUseCase(repo);
    }

    @Nested
    @DisplayName("Validation heures")
    class HeureValidation {

        @Test
        @DisplayName("throws when heureDebut equals heureFin")
        void execute_heureDebutEqualsHeureFin_throws() {
            LocalTime same = LocalTime.of(9, 0);
            DefineDisponibiliteRequest req = new DefineDisponibiliteRequest(
                DayOfWeek.MONDAY, same, same, 30
            );

            assertThatThrownBy(() -> useCase.execute(medecinId, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("heure");
        }

        @Test
        @DisplayName("throws when heureDebut is after heureFin")
        void execute_heureDebutAfterHeureFin_throws() {
            DefineDisponibiliteRequest req = new DefineDisponibiliteRequest(
                DayOfWeek.TUESDAY,
                LocalTime.of(18, 0),
                LocalTime.of(9, 0),
                30
            );

            assertThatThrownBy(() -> useCase.execute(medecinId, req))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Upsert comportement")
    class UpsertBehavior {

        private final DefineDisponibiliteRequest req = new DefineDisponibiliteRequest(
            DayOfWeek.WEDNESDAY,
            LocalTime.of(9, 0),
            LocalTime.of(17, 0),
            30
        );

        @Test
        @DisplayName("deletes existing before saving new")
        void execute_alwaysDeletesThenSaves() {
            Disponibilite saved = new Disponibilite(
                UUID.randomUUID(), medecinId,
                DayOfWeek.WEDNESDAY,
                LocalTime.of(9, 0), LocalTime.of(17, 0), 30
            );
            when(repo.save(any())).thenReturn(saved);

            useCase.execute(medecinId, req);

            verify(repo).deleteByMedecinIdAndJour(medecinId, DayOfWeek.WEDNESDAY);
            verify(repo).save(any());
        }

        @Test
        @DisplayName("returns saved disponibilite")
        void execute_validRequest_returnsSavedDispo() {
            UUID savedId = UUID.randomUUID();
            Disponibilite saved = new Disponibilite(
                savedId, medecinId,
                DayOfWeek.WEDNESDAY,
                LocalTime.of(9, 0), LocalTime.of(17, 0), 30
            );
            when(repo.save(any())).thenReturn(saved);

            Disponibilite result = useCase.execute(medecinId, req);

            assertThat(result.id()).isEqualTo(savedId);
            assertThat(result.medecinId()).isEqualTo(medecinId);
            assertThat(result.jourSemaine()).isEqualTo(DayOfWeek.WEDNESDAY);
            assertThat(result.heureDebut()).isEqualTo(LocalTime.of(9, 0));
            assertThat(result.heureFin()).isEqualTo(LocalTime.of(17, 0));
            assertThat(result.dureeConsultation()).isEqualTo(30);
        }

        @Test
        @DisplayName("saves with null id for new entity generation")
        void execute_savesWithNullId() {
            Disponibilite saved = new Disponibilite(
                UUID.randomUUID(), medecinId,
                DayOfWeek.WEDNESDAY,
                LocalTime.of(9, 0), LocalTime.of(17, 0), 30
            );
            when(repo.save(any())).thenReturn(saved);

            useCase.execute(medecinId, req);

            verify(repo).save(argThat(d -> d.id() == null));
        }
    }
}