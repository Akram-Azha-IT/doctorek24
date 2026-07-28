package ma.doctorek.doctorek.notification;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.repository.PatientDetailRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.EmailService;
import ma.doctorek.doctorek.service.NotificationRoutingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unicité du rappel J-0.
 *
 * <p>La tâche tourne chaque minute sur une fenêtre de plusieurs minutes : sans marque
 * de passage, un même rendez-vous recevait un e-mail et une notification à chaque tick.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RappelRdvUniciteTest {

    @Mock private NotificationRepository repo;
    @Mock private SimpMessagingTemplate stomp;
    @Mock private RendezVousRepository rdvRepo;
    @Mock private PatientDetailRepository patientDetailRepo;
    @Mock private UserRepository userRepo;
    @Mock private EmailService emailService;
    @Mock private NotificationRoutingService notificationRouting;

    private NotificationService notificationService;

    private static final UUID MEDECIN = UUID.randomUUID();
    private static final UUID PATIENT = UUID.randomUUID();
    private static final UUID RDV = UUID.randomUUID();

    /** Registre réel adossé à un jeu d'identifiants, pour rejouer plusieurs ticks. */
    private Set<UUID> dejaEnvoyes;

    @BeforeEach
    void setUp() {
        dejaEnvoyes = new HashSet<>();
        when(rdvRepo.reserverRappel30Min(any(UUID.class), any(Instant.class)))
            .thenAnswer(i -> dejaEnvoyes.add(i.getArgument(0)) ? 1 : 0);

        RappelRdvRegistre registre = new RappelRdvRegistre(rdvRepo);
        notificationService = new NotificationService(repo, stomp, rdvRepo, patientDetailRepo,
            userRepo, emailService, notificationRouting, registre);

        when(userRepo.findById(MEDECIN)).thenReturn(Optional.of(User.builder()
            .id(MEDECIN).email("doc@test.ma").password("x")
            .firstName("Ilyas").lastName("Sabir").role(Role.MEDECIN).build()));
        when(notificationRouting.resolveCompteUserId(PATIENT)).thenReturn(Optional.of(PATIENT));
        when(notificationRouting.resolveEmail(PATIENT)).thenReturn(Optional.of("patient@test.ma"));
        when(userRepo.findById(PATIENT)).thenReturn(Optional.of(User.builder()
            .id(PATIENT).email("patient@test.ma").password("x")
            .firstName("Momo").lastName("Mimo").role(Role.PATIENT).build()));
    }

    /** Rendez-vous placé dans la fenêtre de rappel, encore non rappelé. */
    private RendezVousEntity rdvDansLaFenetre() {
        LocalDateTime debut = LocalDateTime.now().plusMinutes(30);
        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setId(RDV);
        rdv.setMedecinId(MEDECIN);
        rdv.setPatientId(PATIENT);
        rdv.setDateRdv(debut.toLocalDate());
        rdv.setHeureRdv(debut.toLocalTime());
        rdv.setDuree(30);
        rdv.setStatut("CONFIRME");
        return rdv;
    }

    @Test
    @DisplayName("cinq passages consécutifs n'envoient qu'un seul rappel")
    void sendRdvReminders_ticksRepetes_unSeulEnvoi() {
        // Arrange — la tâche repasse chaque minute sur le même rendez-vous.
        when(rdvRepo.findRappelsEnAttente(any(LocalDate.class), any(LocalDate.class), eq("ANNULE")))
            .thenAnswer(i -> dejaEnvoyes.contains(RDV) ? List.of() : List.of(rdvDansLaFenetre()));

        // Act
        for (int tick = 0; tick < 5; tick++) {
            notificationService.sendRdvReminders();
        }

        // Assert
        verify(emailService, times(1)).sendRappelRdv30Min(eq("patient@test.ma"), any(), anyString());
        verify(repo, times(1)).save(any());
    }

    @Test
    @DisplayName("un rendez-vous hors fenêtre ne déclenche aucun rappel")
    void sendRdvReminders_horsFenetre_aucunEnvoi() {
        // Arrange — consultation dans deux heures : trop tôt pour rappeler.
        LocalDateTime tardif = LocalDateTime.now().plusHours(2);
        RendezVousEntity rdv = rdvDansLaFenetre();
        rdv.setDateRdv(tardif.toLocalDate());
        rdv.setHeureRdv(tardif.toLocalTime());
        when(rdvRepo.findRappelsEnAttente(any(LocalDate.class), any(LocalDate.class), eq("ANNULE")))
            .thenReturn(List.of(rdv));

        // Act
        notificationService.sendRdvReminders();

        // Assert
        verify(emailService, never()).sendRappelRdv30Min(anyString(), any(), anyString());
        verify(rdvRepo, never()).reserverRappel30Min(any(), any());
    }
}
