package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.Creneau;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import ma.doctorek.doctorek.agenda.domain.MedecinSansAgendaException;
import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetCreneauxDisponiblesUseCase")
class GetCreneauxDisponiblesUseCaseTest {

    @Mock
    private DisponibiliteRepository dispoRepo;

    @Mock
    private RendezVousRepository rdvRepo;

    private GetCreneauxDisponiblesUseCase useCase;

    private final UUID medecinId = UUID.randomUUID();

    // Monday 2026-04-13 (MONDAY)
    private final LocalDate monday = LocalDate.of(2026, 4, 13);

    private final Disponibilite mondayDispo = new Disponibilite(
        UUID.randomUUID(), medecinId,
        DayOfWeek.MONDAY,
        LocalTime.of(9, 0), LocalTime.of(11, 0),
        60  // 2 créneaux : 09:00 et 10:00
    );

    @BeforeEach
    void setUp() {
        useCase = new GetCreneauxDisponiblesUseCase(dispoRepo, rdvRepo);
    }

    @Nested
    @DisplayName("Jour sans agenda")
    class NoAgenda {

        @Test
        @DisplayName("throws MedecinSansAgendaException when no dispo for that day")
        void execute_noDispo_throws() {
            when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
                .thenReturn(Optional.empty());

            assertThatThrownBy(() -> useCase.execute(medecinId, monday))
                .isInstanceOf(MedecinSansAgendaException.class)
                .hasMessageContaining(medecinId.toString());
        }
    }

    @Nested
    @DisplayName("Tous créneaux libres")
    class AllFree {

        @Test
        @DisplayName("returns all creneaux as disponible when no rdv exists")
        void execute_noRdv_allCreneauxDisponible() {
            when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
                .thenReturn(Optional.of(mondayDispo));
            when(rdvRepo.findByMedecinIdAndDate(medecinId, monday))
                .thenReturn(List.of());

            List<Creneau> creneaux = useCase.execute(medecinId, monday);

            assertThat(creneaux).hasSize(2);
            assertThat(creneaux).allMatch(Creneau::disponible);
            assertThat(creneaux.get(0).debut()).isEqualTo(LocalTime.of(9, 0));
            assertThat(creneaux.get(0).fin()).isEqualTo(LocalTime.of(10, 0));
            assertThat(creneaux.get(1).debut()).isEqualTo(LocalTime.of(10, 0));
            assertThat(creneaux.get(1).fin()).isEqualTo(LocalTime.of(11, 0));
        }
    }

    @Nested
    @DisplayName("Créneau déjà pris")
    class SomeTaken {

        @Test
        @DisplayName("marks creneau as non-disponible when rdv exists at that time")
        void execute_rdvAt9h_firstCreneauNotDisponible() {
            RendezVous rdvAt9 = new RendezVous(
                UUID.randomUUID(), medecinId, UUID.randomUUID(),
                monday, LocalTime.of(9, 0), 60,
                StatutRdv.EN_ATTENTE, null, LocalDateTime.now()
            );

            when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
                .thenReturn(Optional.of(mondayDispo));
            when(rdvRepo.findByMedecinIdAndDate(medecinId, monday))
                .thenReturn(List.of(rdvAt9));

            List<Creneau> creneaux = useCase.execute(medecinId, monday);

            assertThat(creneaux).hasSize(2);
            assertThat(creneaux.get(0).disponible()).isFalse();
            assertThat(creneaux.get(1).disponible()).isTrue();
        }

        @Test
        @DisplayName("marks all creneaux as non-disponible when all slots taken")
        void execute_allSlotsBooked_noneDisponible() {
            RendezVous rdvAt9 = new RendezVous(
                UUID.randomUUID(), medecinId, UUID.randomUUID(),
                monday, LocalTime.of(9, 0), 60,
                StatutRdv.EN_ATTENTE, null, LocalDateTime.now()
            );
            RendezVous rdvAt10 = new RendezVous(
                UUID.randomUUID(), medecinId, UUID.randomUUID(),
                monday, LocalTime.of(10, 0), 60,
                StatutRdv.EN_ATTENTE, null, LocalDateTime.now()
            );

            when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
                .thenReturn(Optional.of(mondayDispo));
            when(rdvRepo.findByMedecinIdAndDate(medecinId, monday))
                .thenReturn(List.of(rdvAt9, rdvAt10));

            List<Creneau> creneaux = useCase.execute(medecinId, monday);

            assertThat(creneaux).hasSize(2);
            assertThat(creneaux).noneMatch(Creneau::disponible);
        }
    }
}