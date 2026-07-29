package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.ListeAttenteResponse;
import ma.doctorek.doctorek.entity.ListeAttenteEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.exception.ListeAttenteInvalideException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.ListeAttenteRepository;
import ma.doctorek.doctorek.repository.UserRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Liste d'attente : prévenir quand une place se libère.
 *
 * <p>Attribution au premier arrivé : tout le monde est prévenu en même temps et
 * personne n'a de réservation d'avance.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ListeAttenteServiceTest {

    @Mock private ListeAttenteRepository repo;
    @Mock private UserRepository userRepo;
    @Mock private AccesPatientService accesPatientService;
    @Mock private NotificationService notificationService;
    @Mock private NotificationRoutingService notificationRouting;
    @Mock private EmailService emailService;

    private ListeAttenteService service;

    private static final ZoneId ZONE = ZoneId.of("Africa/Casablanca");
    private static final UUID MEDECIN = UUID.randomUUID();
    private static final UUID PATIENT = UUID.randomUUID();
    private static final UUID AUTRE_PATIENT = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new ListeAttenteService(repo, userRepo, accesPatientService,
            notificationService, notificationRouting, emailService, ZONE);

        when(repo.save(any(ListeAttenteEntity.class))).thenAnswer(i -> {
            ListeAttenteEntity e = i.getArgument(0);
            if (e.getId() == null) e.setId(UUID.randomUUID());
            return e;
        });
        when(userRepo.findById(MEDECIN)).thenReturn(Optional.of(User.builder()
            .id(MEDECIN).email("doc@test.ma").password("x")
            .firstName("Hakim").lastName("Tazi").role(Role.MEDECIN).build()));
        when(notificationRouting.resolveCompteUserId(any())).thenAnswer(i -> Optional.of(i.getArgument(0)));
        when(notificationRouting.resolveEmail(any())).thenReturn(Optional.of("patient@test.ma"));
    }

    private LocalDate dans(int jours) {
        return LocalDate.now(ZONE).plusDays(jours);
    }

    private ListeAttenteEntity inscription(UUID patientId) {
        ListeAttenteEntity e = new ListeAttenteEntity();
        e.setId(UUID.randomUUID());
        e.setMedecinId(MEDECIN);
        e.setPatientId(patientId);
        e.setDateDebut(dans(1));
        e.setDateFin(dans(20));
        e.setStatut("ACTIVE");
        return e;
    }

    private RendezVousEntity rdvAnnule(UUID patientId, LocalDate date) {
        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setId(UUID.randomUUID());
        rdv.setMedecinId(MEDECIN);
        rdv.setPatientId(patientId);
        rdv.setDateRdv(date);
        rdv.setHeureRdv(LocalTime.of(9, 30));
        rdv.setDuree(30);
        rdv.setStatut("ANNULE");
        return rdv;
    }

    @Test
    @DisplayName("tous les candidats sont prévenus de la place libérée")
    void notifierCreneauLibere_plusieursCandidats_tousPrevenus() {
        // Arrange
        when(repo.findCandidats(eq(MEDECIN), any(), any()))
            .thenReturn(List.of(inscription(PATIENT), inscription(AUTRE_PATIENT)));

        // Act
        service.notifierCreneauLibere(rdvAnnule(UUID.randomUUID(), dans(5)));

        // Assert
        verify(notificationService, times(2))
            .push(any(), eq("PLACE_LIBEREE"), anyString(), anyString());
        verify(emailService, times(2)).sendPlaceLiberee(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("aucune notification quand personne n'attend")
    void notifierCreneauLibere_aucunCandidat_silence() {
        // Arrange
        when(repo.findCandidats(eq(MEDECIN), any(), any())).thenReturn(List.of());

        // Act
        service.notifierCreneauLibere(rdvAnnule(PATIENT, dans(5)));

        // Assert
        verify(notificationService, never()).push(any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("l'échec d'un envoi n'empêche pas de prévenir les suivants")
    void notifierCreneauLibere_unEnvoiEchoue_lesAutresPassent() {
        // Arrange — le premier destinataire fait échouer l'email.
        when(repo.findCandidats(eq(MEDECIN), any(), any()))
            .thenReturn(List.of(inscription(PATIENT), inscription(AUTRE_PATIENT)));
        when(notificationRouting.resolveEmail(PATIENT)).thenThrow(new IllegalStateException("SMTP down"));

        // Act
        service.notifierCreneauLibere(rdvAnnule(UUID.randomUUID(), dans(5)));

        // Assert
        verify(emailService, times(1)).sendPlaceLiberee(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("une seconde inscription réutilise l'entrée active")
    void inscrire_dejaInscrit_reutiliseLEntree() {
        // Arrange
        ListeAttenteEntity existante = inscription(PATIENT);
        when(repo.findByMedecinIdAndPatientIdAndStatut(MEDECIN, PATIENT, "ACTIVE"))
            .thenReturn(Optional.of(existante));

        // Act
        ListeAttenteResponse res = service.inscrire(MEDECIN, PATIENT, PATIENT, dans(2), dans(9));

        // Assert
        assertThat(res.id()).isEqualTo(existante.getId());
        assertThat(res.dateFin()).isEqualTo(dans(9));
    }

    @Test
    @DisplayName("une plage inversée est refusée")
    void inscrire_plageInversee_refuse() {
        LocalDate debut = dans(10);
        LocalDate fin = dans(3);
        assertThatThrownBy(() -> service.inscrire(MEDECIN, PATIENT, PATIENT, debut, fin))
            .isInstanceOf(ListeAttenteInvalideException.class)
            .hasMessageContaining("précède");
    }

    @Test
    @DisplayName("une plage entièrement passée est refusée")
    void inscrire_plagePassee_refuse() {
        LocalDate debut = dans(-30);
        LocalDate fin = dans(-2);
        assertThatThrownBy(() -> service.inscrire(MEDECIN, PATIENT, PATIENT, debut, fin))
            .isInstanceOf(ListeAttenteInvalideException.class)
            .hasMessageContaining("passée");
    }

    @Test
    @DisplayName("une plage démesurée est refusée")
    void inscrire_plageTropLongue_refuse() {
        LocalDate debut = dans(1);
        LocalDate fin = dans(200);
        assertThatThrownBy(() -> service.inscrire(MEDECIN, PATIENT, PATIENT, debut, fin))
            .isInstanceOf(ListeAttenteInvalideException.class)
            .hasMessageContaining("90");
    }

    @Test
    @DisplayName("l'accès au dossier du patient est vérifié avant inscription")
    void inscrire_verifieLAcces() {
        service.inscrire(MEDECIN, PATIENT, AUTRE_PATIENT, dans(1), dans(5));
        verify(accesPatientService).verifierAcces(AUTRE_PATIENT, PATIENT);
    }

    @Test
    @DisplayName("décrocher une place clôt l'attente")
    void marquerServie_inscriptionActive_passeAServie() {
        // Arrange
        ListeAttenteEntity active = inscription(PATIENT);
        when(repo.findByMedecinIdAndPatientIdAndStatut(MEDECIN, PATIENT, "ACTIVE"))
            .thenReturn(Optional.of(active));

        // Act
        service.marquerServie(MEDECIN, PATIENT);

        // Assert
        assertThat(active.getStatut()).isEqualTo("SERVIE");
    }
}
