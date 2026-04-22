package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousNotFoundException;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.RdvNonAnnulableException;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnnulerRendezVousUseCase")
class AnnulerRendezVousUseCaseTest {

    @Mock
    private RendezVousRepository rdvRepo;

    private AnnulerRendezVousUseCase useCase;

    private final UUID rdvId     = UUID.randomUUID();
    private final UUID medecinId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new AnnulerRendezVousUseCase(rdvRepo);
    }

    private RendezVous rdvWithStatut(StatutRdv statut) {
        return new RendezVous(
            rdvId, medecinId, patientId,
            LocalDate.of(2027, 6, 2), LocalTime.of(10, 0),
            30, statut, "Consultation", null, LocalDateTime.now()
        );
    }

    @Nested
    @DisplayName("execute — happy path")
    class HappyPath {

        @Test
        @DisplayName("annule un RDV EN_ATTENTE et retourne le RDV avec statut ANNULE")
        void annule_rdvEnAttente_returnsAnnule() {
            RendezVous rdv = rdvWithStatut(StatutRdv.EN_ATTENTE);
            RendezVous cancelled = rdv.annuler();
            when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdv));
            when(rdvRepo.save(any())).thenReturn(cancelled);

            RendezVous result = useCase.execute(rdvId);

            assertThat(result.statut()).isEqualTo(StatutRdv.ANNULE);
            verify(rdvRepo).save(any(RendezVous.class));
        }

        @Test
        @DisplayName("annule un RDV CONFIRME et retourne le RDV avec statut ANNULE")
        void annule_rdvConfirme_returnsAnnule() {
            RendezVous rdv = rdvWithStatut(StatutRdv.CONFIRME);
            RendezVous cancelled = rdv.annuler();
            when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdv));
            when(rdvRepo.save(any())).thenReturn(cancelled);

            RendezVous result = useCase.execute(rdvId);

            assertThat(result.statut()).isEqualTo(StatutRdv.ANNULE);
        }
    }

    @Nested
    @DisplayName("execute — erreurs")
    class Errors {

        @Test
        @DisplayName("lève RendezVousNotFoundException quand le RDV est introuvable")
        void throws_whenRdvNotFound() {
            when(rdvRepo.findById(rdvId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> useCase.execute(rdvId))
                .isInstanceOf(RendezVousNotFoundException.class)
                .hasMessageContaining(rdvId.toString());

            verify(rdvRepo, never()).save(any());
        }

        @Test
        @DisplayName("lève RdvNonAnnulableException quand le statut est ANNULE")
        void throws_whenAlreadyAnnule() {
            when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdvWithStatut(StatutRdv.ANNULE)));

            assertThatThrownBy(() -> useCase.execute(rdvId))
                .isInstanceOf(RdvNonAnnulableException.class);

            verify(rdvRepo, never()).save(any());
        }

        @Test
        @DisplayName("lève RdvNonAnnulableException quand le statut est TERMINE")
        void throws_whenTermine() {
            when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdvWithStatut(StatutRdv.TERMINE)));

            assertThatThrownBy(() -> useCase.execute(rdvId))
                .isInstanceOf(RdvNonAnnulableException.class);

            verify(rdvRepo, never()).save(any());
        }
    }
}
