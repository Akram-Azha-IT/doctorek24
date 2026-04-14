package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.application.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.agenda.domain.CreneauIndisponibleException;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PrendreRdvUseCase")
class PrendreRdvUseCaseTest {

    @Mock
    private DisponibiliteRepository dispoRepo;

    @Mock
    private RendezVousRepository rdvRepo;

    private PrendreRdvUseCase useCase;

    private final UUID medecinId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();

    // MONDAY 2026-04-20 (future date)
    private final LocalDate dateRdv   = LocalDate.of(2026, 4, 20);
    private final LocalTime heureRdv  = LocalTime.of(9, 0);

    private final Disponibilite dispo = new Disponibilite(
        UUID.randomUUID(), medecinId,
        DayOfWeek.MONDAY,
        LocalTime.of(9, 0), LocalTime.of(17, 0), 30
    );

    @BeforeEach
    void setUp() {
        useCase = new PrendreRdvUseCase(dispoRepo, rdvRepo);
    }

    @Nested
    @DisplayName("execute — happy path")
    class HappyPath {

        @Test
        @DisplayName("saves and returns RendezVous with statut EN_ATTENTE")
        void savesRdvWithStatutEnAttente() {
            when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
                .thenReturn(Optional.of(dispo));
            when(rdvRepo.existsByMedecinIdAndDateAndHeure(medecinId, dateRdv, heureRdv))
                .thenReturn(false);

            RendezVous saved = new RendezVous(
                UUID.randomUUID(), medecinId, patientId,
                dateRdv, heureRdv, 30, StatutRdv.EN_ATTENTE, "Consultation", null
            );
            when(rdvRepo.save(any())).thenReturn(saved);

            PrendreRdvRequest request = new PrendreRdvRequest(
                medecinId, patientId, dateRdv, heureRdv, "Consultation"
            );

            RendezVous result = useCase.execute(request);

            assertThat(result.statut()).isEqualTo(StatutRdv.EN_ATTENTE);
            assertThat(result.medecinId()).isEqualTo(medecinId);
            assertThat(result.patientId()).isEqualTo(patientId);
        }

        @Test
        @DisplayName("persists correct duree from disponibilite")
        void persistsCorrectDuree() {
            when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
                .thenReturn(Optional.of(dispo));
            when(rdvRepo.existsByMedecinIdAndDateAndHeure(medecinId, dateRdv, heureRdv))
                .thenReturn(false);

            ArgumentCaptor<RendezVous> captor = ArgumentCaptor.forClass(RendezVous.class);
            RendezVous saved = new RendezVous(
                UUID.randomUUID(), medecinId, patientId,
                dateRdv, heureRdv, 30, StatutRdv.EN_ATTENTE, null, null
            );
            when(rdvRepo.save(captor.capture())).thenReturn(saved);

            useCase.execute(new PrendreRdvRequest(medecinId, patientId, dateRdv, heureRdv, null));

            assertThat(captor.getValue().duree()).isEqualTo(30);
            assertThat(captor.getValue().statut()).isEqualTo(StatutRdv.EN_ATTENTE);
        }
    }

    @Nested
    @DisplayName("execute — error cases")
    class ErrorCases {

        @Test
        @DisplayName("throws MedecinSansAgendaException when no disponibilite for that day")
        void throwsWhenNoDisponibilite() {
            when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
                .thenReturn(Optional.empty());

            PrendreRdvRequest request = new PrendreRdvRequest(
                medecinId, patientId, dateRdv, heureRdv, null
            );

            assertThatThrownBy(() -> useCase.execute(request))
                .isInstanceOf(MedecinSansAgendaException.class);
        }

        @Test
        @DisplayName("throws CreneauIndisponibleException when slot is already taken")
        void throwsWhenCreneauPris() {
            when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
                .thenReturn(Optional.of(dispo));
            when(rdvRepo.existsByMedecinIdAndDateAndHeure(medecinId, dateRdv, heureRdv))
                .thenReturn(true);

            PrendreRdvRequest request = new PrendreRdvRequest(
                medecinId, patientId, dateRdv, heureRdv, null
            );

            assertThatThrownBy(() -> useCase.execute(request))
                .isInstanceOf(CreneauIndisponibleException.class);
        }
    }

    @Test
    @DisplayName("delegates save to repository")
    void delegatesSaveToRepository() {
        when(dispoRepo.findByMedecinIdAndJour(medecinId, DayOfWeek.MONDAY))
            .thenReturn(Optional.of(dispo));
        when(rdvRepo.existsByMedecinIdAndDateAndHeure(medecinId, dateRdv, heureRdv))
            .thenReturn(false);
        RendezVous saved = new RendezVous(
            UUID.randomUUID(), medecinId, patientId,
            dateRdv, heureRdv, 30, StatutRdv.EN_ATTENTE, null, null
        );
        when(rdvRepo.save(any())).thenReturn(saved);

        useCase.execute(new PrendreRdvRequest(medecinId, patientId, dateRdv, heureRdv, null));

        verify(rdvRepo).save(any());
    }
}
