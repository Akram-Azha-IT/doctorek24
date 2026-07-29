package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Rappels quotidiens J-1 et J-2.
 *
 * <p>Chaque destinataire du foyer doit recevoir le rappel : le proche qui a donné son
 * adresse comme le titulaire qui l'accompagne.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RappelSchedulerTest {

    @Mock private RendezVousRepository rdvRepo;
    @Mock private EmailService emailService;
    @Mock private NotificationRoutingService notificationRouting;

    private RappelScheduler scheduler;

    private static final ZoneId ZONE = ZoneId.of("Africa/Casablanca");
    private static final UUID PATIENT = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        scheduler = new RappelScheduler(rdvRepo, emailService, notificationRouting, ZONE);
    }

    private RendezVousEntity rdv() {
        RendezVousEntity r = new RendezVousEntity();
        r.setId(UUID.randomUUID());
        r.setPatientId(PATIENT);
        r.setDateRdv(LocalDate.now(ZONE).plusDays(1));
        r.setHeureRdv(LocalTime.of(9, 30));
        r.setDuree(30);
        r.setStatut("CONFIRME");
        return r;
    }

    /** Un seul rendez-vous à J-1, aucun à J-2. */
    private void unRdvDemain() {
        LocalDate demain = LocalDate.now(ZONE).plusDays(1);
        when(rdvRepo.streamByDateRdvAndStatutNot(any(LocalDate.class), anyString()))
            .thenAnswer(i -> demain.equals(i.getArgument(0)) ? Stream.of(rdv()) : Stream.empty());
    }

    @Test
    @DisplayName("le proche et son titulaire reçoivent chacun le rappel")
    void envoyerRappels_deuxDestinataires_deuxEnvois() {
        // Arrange
        unRdvDemain();
        when(notificationRouting.resolveTousEmails(PATIENT))
            .thenReturn(Set.of("momo@test.ma", "akram@test.ma"));

        // Act
        scheduler.envoyerRappelsQuotidiens();

        // Assert
        verify(emailService).sendRappelRdv(eq("momo@test.ma"), any(), eq(1));
        verify(emailService).sendRappelRdv(eq("akram@test.ma"), any(), eq(1));
    }

    @Test
    @DisplayName("sans destinataire, rien n'est envoyé")
    void envoyerRappels_aucunDestinataire_aucunEnvoi() {
        // Arrange
        unRdvDemain();
        when(notificationRouting.resolveTousEmails(PATIENT)).thenReturn(Set.of());

        // Act
        scheduler.envoyerRappelsQuotidiens();

        // Assert
        verify(emailService, never()).sendRappelRdv(anyString(), any(), anyInt());
    }

    @Test
    @DisplayName("les deux échéances J-1 et J-2 sont balayées")
    void envoyerRappels_balaieLesDeuxEcheances() {
        // Arrange
        LocalDate aujourdhui = LocalDate.now(ZONE);
        when(rdvRepo.streamByDateRdvAndStatutNot(any(LocalDate.class), anyString()))
            .thenAnswer(i -> Stream.empty());

        // Act
        scheduler.envoyerRappelsQuotidiens();

        // Assert
        verify(rdvRepo).streamByDateRdvAndStatutNot(aujourdhui.plusDays(1), "ANNULE");
        verify(rdvRepo).streamByDateRdvAndStatutNot(aujourdhui.plusDays(2), "ANNULE");
        verify(rdvRepo, times(2)).streamByDateRdvAndStatutNot(any(LocalDate.class), anyString());
    }
}
