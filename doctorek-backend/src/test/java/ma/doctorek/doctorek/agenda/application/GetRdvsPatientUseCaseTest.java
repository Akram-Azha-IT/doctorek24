package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetRdvsPatientUseCase")
class GetRdvsPatientUseCaseTest {

    @Mock
    private RendezVousRepository rdvRepo;

    private GetRdvsPatientUseCase useCase;

    private final UUID patientId = UUID.randomUUID();
    private final UUID medecinId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new GetRdvsPatientUseCase(rdvRepo);
    }

    @Test
    @DisplayName("returns list of rdvs for the patient")
    void returnsPatientRdvs() {
        RendezVous rdv = new RendezVous(
            UUID.randomUUID(), medecinId, patientId,
            LocalDate.of(2026, 4, 20), LocalTime.of(9, 0),
            30, StatutRdv.EN_ATTENTE, "Consultation", null, null
        );
        when(rdvRepo.findByPatientId(patientId)).thenReturn(List.of(rdv));

        List<RendezVous> result = useCase.execute(patientId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).patientId()).isEqualTo(patientId);
    }

    @Test
    @DisplayName("returns empty list when patient has no rdvs")
    void returnsEmptyWhenNoRdvs() {
        when(rdvRepo.findByPatientId(patientId)).thenReturn(List.of());

        List<RendezVous> result = useCase.execute(patientId);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("delegates to repository")
    void delegatesToRepository() {
        when(rdvRepo.findByPatientId(patientId)).thenReturn(List.of());

        useCase.execute(patientId);

        verify(rdvRepo).findByPatientId(patientId);
    }
}