package ma.doctorek.doctorek.notification;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import ma.doctorek.doctorek.auth.domain.User;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RappelScheduler")
class RappelSchedulerTest {

    @Mock
    private RendezVousRepository rdvRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private EmailService emailService;

    @Mock
    private User patient;

    @InjectMocks
    private RappelScheduler scheduler;

    private final UUID patientId = UUID.randomUUID();

    private RendezVous rdvAt(LocalDate date) {
        return new RendezVous(
            UUID.randomUUID(), UUID.randomUUID(), patientId,
            date, LocalTime.of(10, 0), 30,
            StatutRdv.EN_ATTENTE, "Suivi", null, LocalDateTime.now()
        );
    }

    @BeforeEach
    void stubPatient() {
        // Lenient mock: some test paths may not resolve a patient.
        org.mockito.Mockito.lenient().when(patient.getEmail()).thenReturn("patient@example.com");
        org.mockito.Mockito.lenient().when(userRepo.findById(patientId)).thenReturn(Optional.of(patient));
    }

    @Test
    @DisplayName("queries repository for J-1 and J-2 dates, excluding ANNULE")
    void queriesBothWindows() {
        LocalDate today = LocalDate.now();
        when(rdvRepo.findByDateAndStatutNot(any(LocalDate.class), eq(StatutRdv.ANNULE)))
            .thenReturn(List.of());

        scheduler.envoyerRappelsQuotidiens();

        verify(rdvRepo).findByDateAndStatutNot(today.plusDays(1), StatutRdv.ANNULE);
        verify(rdvRepo).findByDateAndStatutNot(today.plusDays(2), StatutRdv.ANNULE);
    }

    @Test
    @DisplayName("sends J-1 reminder for each RDV on tomorrow's date")
    void sendsJ1Reminders() {
        LocalDate today = LocalDate.now();
        RendezVous r1 = rdvAt(today.plusDays(1));
        RendezVous r2 = rdvAt(today.plusDays(1));

        when(rdvRepo.findByDateAndStatutNot(today.plusDays(1), StatutRdv.ANNULE))
            .thenReturn(List.of(r1, r2));
        when(rdvRepo.findByDateAndStatutNot(today.plusDays(2), StatutRdv.ANNULE))
            .thenReturn(List.of());

        scheduler.envoyerRappelsQuotidiens();

        verify(emailService).sendRappelRdv("patient@example.com", r1, 1);
        verify(emailService).sendRappelRdv("patient@example.com", r2, 1);
    }

    @Test
    @DisplayName("sends J-2 reminder with joursAvant=2 for RDVs on day+2")
    void sendsJ2Reminders() {
        LocalDate today = LocalDate.now();
        RendezVous r = rdvAt(today.plusDays(2));

        when(rdvRepo.findByDateAndStatutNot(today.plusDays(1), StatutRdv.ANNULE))
            .thenReturn(List.of());
        when(rdvRepo.findByDateAndStatutNot(today.plusDays(2), StatutRdv.ANNULE))
            .thenReturn(List.of(r));

        scheduler.envoyerRappelsQuotidiens();

        verify(emailService).sendRappelRdv("patient@example.com", r, 2);
    }

    @Test
    @DisplayName("skips RDV and does not call email when patient is not found")
    void skipsWhenPatientMissing() {
        LocalDate today = LocalDate.now();
        RendezVous orphan = rdvAt(today.plusDays(1));

        when(rdvRepo.findByDateAndStatutNot(today.plusDays(1), StatutRdv.ANNULE))
            .thenReturn(List.of(orphan));
        when(rdvRepo.findByDateAndStatutNot(today.plusDays(2), StatutRdv.ANNULE))
            .thenReturn(List.of());
        when(userRepo.findById(orphan.patientId())).thenReturn(Optional.empty());

        scheduler.envoyerRappelsQuotidiens();

        verify(emailService, never()).sendRappelRdv(any(), any(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    @DisplayName("does nothing when no RDVs are found in either window")
    void noRdvsNoEmails() {
        when(rdvRepo.findByDateAndStatutNot(any(LocalDate.class), eq(StatutRdv.ANNULE)))
            .thenReturn(List.of());

        scheduler.envoyerRappelsQuotidiens();

        verify(emailService, never()).sendRappelRdv(any(), any(), org.mockito.ArgumentMatchers.anyInt());
    }
}
