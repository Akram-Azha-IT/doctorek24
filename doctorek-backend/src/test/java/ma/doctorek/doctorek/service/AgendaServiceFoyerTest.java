package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.FamilleMembreResponse;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.DisponibiliteRepository;
import ma.doctorek.doctorek.repository.FamilleMembreProjection;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Foyer d'un patient vu par le médecin.
 *
 * <p>Un titulaire réserve pour ses proches : leurs dossiers paraissaient sans lien.
 * Ce regroupement est purement présentationnel — chaque dossier médical reste séparé.
 */
@ExtendWith(MockitoExtension.class)
class AgendaServiceFoyerTest {

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

    private AgendaService agendaService;

    private static final UUID MEDECIN = UUID.randomUUID();
    private static final UUID TITULAIRE = UUID.randomUUID();
    private static final UUID PROCHE = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        agendaService = new AgendaService(dispoRepo, rdvRepo, userRepo, patientRepo, emailService,
            questionnaireSerializer, accesPatientService, notificationRouting, rattachementService,
            patientPivotService, notificationService, "https://app.test");
    }

    private static FamilleMembreProjection membre(UUID id, String prenom, String nom,
                                                 String photo, UUID gestionnaire, String gestionnaireNom) {
        return new FamilleMembreProjection() {
            @Override public String getPatientId() { return id.toString(); }
            @Override public String getFirstName() { return prenom; }
            @Override public String getLastName() { return nom; }
            @Override public String getPhotoUrl() { return photo; }
            @Override public String getGestionnaireId() { return gestionnaire == null ? null : gestionnaire.toString(); }
            @Override public String getGestionnaireNom() { return gestionnaireNom; }
        };
    }

    @Test
    @DisplayName("le foyer expose le titulaire et ses proches suivis par ce médecin")
    void getFoyerPatient_titulaireEtProche_retourneLesDeux() {
        // Arrange
        when(rdvRepo.findFoyerByMedecinAndPatient(MEDECIN, PROCHE)).thenReturn(List.of(
            membre(TITULAIRE, "Akram", "Benhammou", "https://cdn/a.png", null, null),
            membre(PROCHE, "Momo", "Mimo", null, TITULAIRE, "Akram Benhammou")));

        // Act
        List<FamilleMembreResponse> foyer = agendaService.getFoyerPatient(MEDECIN, PROCHE);

        // Assert
        assertThat(foyer).hasSize(2);
        assertThat(foyer.get(0).patientId()).isEqualTo(TITULAIRE);
        assertThat(foyer.get(0).photoUrl()).isEqualTo("https://cdn/a.png");
        assertThat(foyer.get(0).gestionnaireId()).isNull();
        assertThat(foyer.get(1).patientId()).isEqualTo(PROCHE);
        assertThat(foyer.get(1).gestionnaireId()).isEqualTo(TITULAIRE.toString());
        assertThat(foyer.get(1).gestionnaireNom()).isEqualTo("Akram Benhammou");
    }

    @Test
    @DisplayName("un patient sans proche ne renvoie que lui-même")
    void getFoyerPatient_patientSeul_retourneLuiMeme() {
        // Arrange
        when(rdvRepo.findFoyerByMedecinAndPatient(MEDECIN, TITULAIRE)).thenReturn(List.of(
            membre(TITULAIRE, "Akram", "Benhammou", null, null, null)));

        // Act
        List<FamilleMembreResponse> foyer = agendaService.getFoyerPatient(MEDECIN, TITULAIRE);

        // Assert
        assertThat(foyer).singleElement()
            .extracting(FamilleMembreResponse::patientId).isEqualTo(TITULAIRE);
    }
}
