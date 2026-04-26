package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.application.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import ma.doctorek.doctorek.agenda.domain.FrequenceDisponibilite;
import ma.doctorek.doctorek.agenda.domain.TypeFinRecurrence;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
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

    private static Disponibilite fakeDispo(UUID id, UUID medecinId, DayOfWeek jour,
                                           LocalTime debut, LocalTime fin) {
        return new Disponibilite(
            id, medecinId, jour, debut, fin, 30,
            FrequenceDisponibilite.TOUTES_LES_SEMAINES, 1,
            LocalDate.now(), TypeFinRecurrence.JAMAIS, null
        );
    }

    private static DefineDisponibiliteRequest simpleReq(DayOfWeek jour, LocalTime debut, LocalTime fin) {
        return new DefineDisponibiliteRequest(jour, debut, fin, 30, null, null, null, null, null);
    }

    @Nested
    @DisplayName("Validation heures")
    class HeureValidation {

        @Test
        @DisplayName("throws when heureDebut equals heureFin")
        void execute_heureDebutEqualsHeureFin_throws() {
            LocalTime same = LocalTime.of(9, 0);
            DefineDisponibiliteRequest req = simpleReq(DayOfWeek.MONDAY, same, same);

            assertThatThrownBy(() -> useCase.execute(medecinId, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("heure");
        }

        @Test
        @DisplayName("throws when heureDebut is after heureFin")
        void execute_heureDebutAfterHeureFin_throws() {
            DefineDisponibiliteRequest req = simpleReq(
                DayOfWeek.TUESDAY, LocalTime.of(18, 0), LocalTime.of(9, 0));

            assertThatThrownBy(() -> useCase.execute(medecinId, req))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Comportement d'ajout (multi-blocs)")
    class AddBehavior {

        private final DefineDisponibiliteRequest req = simpleReq(
            DayOfWeek.WEDNESDAY, LocalTime.of(9, 0), LocalTime.of(12, 0));

        @Test
        @DisplayName("saves new block if no overlap")
        void execute_noOverlap_saves() {
            when(repo.findAllByMedecinIdAndJour(medecinId, DayOfWeek.WEDNESDAY))
                .thenReturn(java.util.List.of());
            when(repo.save(any())).thenReturn(
                fakeDispo(UUID.randomUUID(), medecinId, DayOfWeek.WEDNESDAY,
                    LocalTime.of(9, 0), LocalTime.of(12, 0)));

            useCase.execute(medecinId, req);

            verify(repo).findAllByMedecinIdAndJour(medecinId, DayOfWeek.WEDNESDAY);
            verify(repo).save(any());
        }

        @Test
        @DisplayName("throws IllegalArgumentException when overlapping block exists")
        void execute_withOverlap_throws() {
            Disponibilite existing = fakeDispo(UUID.randomUUID(), medecinId,
                DayOfWeek.WEDNESDAY, LocalTime.of(10, 0), LocalTime.of(14, 0));
            when(repo.findAllByMedecinIdAndJour(medecinId, DayOfWeek.WEDNESDAY))
                .thenReturn(java.util.List.of(existing));

            assertThatThrownBy(() -> useCase.execute(medecinId, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("chevauche");

            verify(repo, never()).save(any());
        }

        @Test
        @DisplayName("returns saved disponibilite")
        void execute_validRequest_returnsSavedDispo() {
            UUID savedId = UUID.randomUUID();
            Disponibilite saved = fakeDispo(savedId, medecinId,
                DayOfWeek.WEDNESDAY, LocalTime.of(9, 0), LocalTime.of(12, 0));
            when(repo.findAllByMedecinIdAndJour(medecinId, DayOfWeek.WEDNESDAY))
                .thenReturn(java.util.List.of());
            when(repo.save(any())).thenReturn(saved);

            Disponibilite result = useCase.execute(medecinId, req);

            assertThat(result.id()).isEqualTo(savedId);
            assertThat(result.medecinId()).isEqualTo(medecinId);
            assertThat(result.jourSemaine()).isEqualTo(DayOfWeek.WEDNESDAY);
            assertThat(result.heureDebut()).isEqualTo(LocalTime.of(9, 0));
            assertThat(result.heureFin()).isEqualTo(LocalTime.of(12, 0));
            assertThat(result.dureeConsultation()).isEqualTo(30);
        }

        @Test
        @DisplayName("saves with null id for new entity generation")
        void execute_savesWithNullId() {
            Disponibilite saved = fakeDispo(UUID.randomUUID(), medecinId,
                DayOfWeek.WEDNESDAY, LocalTime.of(9, 0), LocalTime.of(12, 0));
            when(repo.findAllByMedecinIdAndJour(medecinId, DayOfWeek.WEDNESDAY))
                .thenReturn(java.util.List.of());
            when(repo.save(any())).thenReturn(saved);

            useCase.execute(medecinId, req);

            verify(repo).save(argThat(d -> d.id() == null));
        }
    }
}
