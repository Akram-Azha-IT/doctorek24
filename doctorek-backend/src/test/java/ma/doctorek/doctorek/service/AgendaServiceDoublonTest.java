package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.CreerRdvMedecinRequest;
import ma.doctorek.doctorek.entity.DisponibiliteEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.exception.CreneauIndisponibleException;
import ma.doctorek.doctorek.exception.PatientAmbiguException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.DisponibiliteRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Month;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Saisie d'un patient au comptoir : ne pas créer un second dossier.
 *
 * <p>Chaque saisie ouvrait un dossier neuf. Le même patient revu six mois plus tard
 * se retrouvait avec deux dossiers, ses allergies dans l'un et la prescription dans
 * l'autre.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AgendaServiceDoublonTest {

    @Mock private DisponibiliteRepository dispoRepo;
    @Mock private RendezVousRepository rdvRepo;
    @Mock private UserRepository userRepo;
    @Mock private PatientRepository patientRepo;
    @Mock private EmailService emailService;
    @Mock private QuestionnaireSerializer questionnaireSerializer;
    @Mock private AccesPatientService accesPatientService;
    @Mock private NotificationRoutingService notificationRouting;
    @Mock private RattachementService rattachementService;
    @Mock private PatientPivotService patientPivotService;
    @Mock private NotificationService notificationService;
    @Mock private ListeAttenteService listeAttenteService;

    private AgendaService agendaService;

    private static final UUID MEDECIN = UUID.randomUUID();
    private static final UUID DOSSIER_EXISTANT = UUID.randomUUID();
    private static final LocalDate NAISSANCE = LocalDate.of(1990, Month.MARCH, 12);
    private static final LocalDate DATE = LocalDate.of(2026, Month.SEPTEMBER, 15);

    @BeforeEach
    void setUp() {
        agendaService = new AgendaService(dispoRepo, rdvRepo, userRepo, patientRepo, emailService,
            questionnaireSerializer, accesPatientService, notificationRouting, rattachementService,
            patientPivotService, notificationService, listeAttenteService, "https://app.test");

        DisponibiliteEntity dispo = new DisponibiliteEntity();
        dispo.setDureeConsultation(30);
        when(dispoRepo.findByMedecinIdAndJourSemaine(eq(MEDECIN), anyString()))
            .thenReturn(Optional.of(dispo));
        when(rdvRepo.existsByMedecinIdAndDateRdvAndHeureRdvAndStatutNot(any(), any(), any(), anyString()))
            .thenReturn(false);
        when(rdvRepo.saveAndFlush(any(RendezVousEntity.class))).thenAnswer(i -> {
            RendezVousEntity r = i.getArgument(0);
            if (r.getId() == null) r.setId(UUID.randomUUID());
            return r;
        });
        when(patientRepo.save(any(PatientEntity.class))).thenAnswer(i -> {
            PatientEntity p = i.getArgument(0);
            if (p.getId() == null) p.setId(UUID.randomUUID());
            return p;
        });
    }

    private PatientEntity dossier(UUID id) {
        PatientEntity p = new PatientEntity("Alaoui", "Yassine", NAISSANCE);
        p.setId(id);
        return p;
    }

    private CreerRdvMedecinRequest requete(LocalDate dateNaissance) {
        return new CreerRdvMedecinRequest(null,
            new CreerRdvMedecinRequest.NouveauPatient("Alaoui", "Yassine", dateNaissance, null, null),
            DATE, LocalTime.of(10, 0), "Contrôle");
    }

    @Test
    @DisplayName("un dossier identique est réutilisé au lieu d'être dupliqué")
    void creerRdv_dossierExistant_reutilise() {
        // Arrange
        when(patientRepo.findHomonymesChezMedecin(MEDECIN, "Alaoui", "Yassine", NAISSANCE))
            .thenReturn(List.of(dossier(DOSSIER_EXISTANT)));

        // Act
        agendaService.creerRdvParMedecin(MEDECIN, requete(NAISSANCE));

        // Assert
        verify(patientRepo, never()).save(any(PatientEntity.class));
        ArgumentCaptor<RendezVousEntity> captor = ArgumentCaptor.forClass(RendezVousEntity.class);
        verify(rdvRepo).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getPatientId()).isEqualTo(DOSSIER_EXISTANT);
    }

    @Test
    @DisplayName("un patient inconnu obtient bien un nouveau dossier")
    void creerRdv_patientInconnu_creeLeDossier() {
        // Arrange
        when(patientRepo.findHomonymesChezMedecin(any(), any(), any(), any())).thenReturn(List.of());

        // Act
        agendaService.creerRdvParMedecin(MEDECIN, requete(NAISSANCE));

        // Assert
        verify(patientRepo).save(any(PatientEntity.class));
    }

    @Test
    @DisplayName("deux homonymes de même date de naissance : le praticien doit trancher")
    void creerRdv_homonymesAmbigus_refuse() {
        // Arrange — fusionner deux dossiers médicaux serait pire que le doublon.
        when(patientRepo.findHomonymesChezMedecin(MEDECIN, "Alaoui", "Yassine", NAISSANCE))
            .thenReturn(List.of(dossier(UUID.randomUUID()), dossier(UUID.randomUUID())));

        // Act + Assert
        assertThatThrownBy(() -> agendaService.creerRdvParMedecin(MEDECIN, requete(NAISSANCE)))
            .isInstanceOf(PatientAmbiguException.class)
            .hasMessageContaining("Sélectionnez");
    }

    @Test
    @DisplayName("sans date de naissance, aucun rapprochement n'est tenté")
    void creerRdv_sansDateNaissance_neRapprochePas() {
        // Arrange — le nom seul ne distingue pas deux personnes.

        // Act
        agendaService.creerRdvParMedecin(MEDECIN, requete(null));

        // Assert
        verify(patientRepo, never()).findHomonymesChezMedecin(any(), any(), any(), any());
        verify(patientRepo).save(any(PatientEntity.class));
    }

    @Test
    @DisplayName("le créneau raflé entre-temps remonte une erreur métier")
    void creerRdv_creneauRafle_erreurMetier() {
        // Arrange — la contrainte base tranche la course entre deux réservations.
        when(patientRepo.findHomonymesChezMedecin(any(), any(), any(), any())).thenReturn(List.of());
        when(rdvRepo.saveAndFlush(any(RendezVousEntity.class)))
            .thenThrow(new DataIntegrityViolationException("uq_rdv_creneau_actif"));

        // Act + Assert
        assertThatThrownBy(() -> agendaService.creerRdvParMedecin(MEDECIN, requete(NAISSANCE)))
            .isInstanceOf(CreneauIndisponibleException.class);
    }

    @Test
    @DisplayName("un créneau annulé redevient réservable")
    void creerRdv_creneauAnnule_reservable() {
        // Arrange — la vérification ignorait le statut : le créneau s'affichait libre
        // dans l'agenda mais toute réservation échouait, y compris pour la liste d'attente.
        when(patientRepo.findHomonymesChezMedecin(any(), any(), any(), any())).thenReturn(List.of());

        // Act
        agendaService.creerRdvParMedecin(MEDECIN, requete(NAISSANCE));

        // Assert
        verify(rdvRepo).existsByMedecinIdAndDateRdvAndHeureRdvAndStatutNot(
            eq(MEDECIN), eq(DATE), eq(LocalTime.of(10, 0)), eq("ANNULE"));
    }
}
