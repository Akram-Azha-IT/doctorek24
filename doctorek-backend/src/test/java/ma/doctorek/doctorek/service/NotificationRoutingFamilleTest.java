package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.GestionEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.RoleGestion;
import ma.doctorek.doctorek.repository.GestionRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
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
import java.time.Month;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Destinataires d'un rappel dans un compte famille.
 *
 * <p>Le routage nominal est exclusif : le proche <em>ou</em> son gestionnaire. Pour un
 * rappel c'est trop peu — le titulaire accompagne souvent le proche et doit être prévenu
 * même quand celui-ci a sa propre adresse.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationRoutingFamilleTest {

    @Mock private PatientRepository patientRepository;
    @Mock private GestionRepository gestionRepository;
    @Mock private UserRepository userRepository;

    private NotificationRoutingService service;

    private static final UUID PROCHE = UUID.randomUUID();
    private static final UUID TITULAIRE = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new NotificationRoutingService(patientRepository, gestionRepository, userRepository);
        when(userRepository.findById(TITULAIRE)).thenReturn(Optional.of(User.builder()
            .id(TITULAIRE).email("Akram@Test.MA").password("x")
            .firstName("Akram").lastName("Benhammou").role(Role.PATIENT).build()));
    }

    private PatientEntity proche(String email, UUID compteId) {
        PatientEntity p = new PatientEntity("Mimo", "Momo", LocalDate.of(2015, Month.APRIL, 3));
        p.setId(PROCHE);
        p.setEmail(email);
        p.setCompteId(compteId);
        return p;
    }

    private void avecTitulaire() {
        GestionEntity g = new GestionEntity(TITULAIRE, PROCHE, RoleGestion.PARENT, true);
        when(gestionRepository.findByPatientIdAndActifTrue(PROCHE)).thenReturn(List.of(g));
    }

    @Test
    @DisplayName("le proche et son titulaire reçoivent tous deux le rappel")
    void resolveTousEmails_procheAvecEmail_lesDeux() {
        // Arrange
        when(patientRepository.findById(PROCHE)).thenReturn(Optional.of(proche("momo@test.ma", null)));
        avecTitulaire();

        // Act
        var emails = service.resolveTousEmails(PROCHE);

        // Assert
        assertThat(emails).containsExactlyInAnyOrder("momo@test.ma", "akram@test.ma");
    }

    @Test
    @DisplayName("sans adresse propre, seul le titulaire est prévenu")
    void resolveTousEmails_procheSansEmail_titulaireSeul() {
        // Arrange
        when(patientRepository.findById(PROCHE)).thenReturn(Optional.of(proche(null, null)));
        avecTitulaire();

        // Act & Assert
        assertThat(service.resolveTousEmails(PROCHE)).containsExactly("akram@test.ma");
    }

    @Test
    @DisplayName("une boîte partagée ne reçoit qu'un seul rappel")
    void resolveTousEmails_memeAdresse_dedoublonnee() {
        // Arrange — un parent inscrit souvent son enfant avec sa propre adresse.
        when(patientRepository.findById(PROCHE))
            .thenReturn(Optional.of(proche("  AKRAM@test.ma ", null)));
        avecTitulaire();

        // Act & Assert
        assertThat(service.resolveTousEmails(PROCHE)).containsExactly("akram@test.ma");
    }

    @Test
    @DisplayName("un patient sans gestionnaire reste notifié seul")
    void resolveTousEmails_patientAutonome_luiSeul() {
        // Arrange
        when(patientRepository.findById(PROCHE))
            .thenReturn(Optional.of(proche("sara@test.ma", PROCHE)));
        when(gestionRepository.findByPatientIdAndActifTrue(PROCHE)).thenReturn(List.of());

        // Act & Assert
        assertThat(service.resolveTousEmails(PROCHE)).containsExactly("sara@test.ma");
    }

    @Test
    @DisplayName("un patient introuvable ne fait planter aucun rappel")
    void resolveTousEmails_patientInconnu_listeVide() {
        when(patientRepository.findById(PROCHE)).thenReturn(Optional.empty());
        assertThat(service.resolveTousEmails(PROCHE)).isEmpty();
    }

    @Test
    @DisplayName("les notifications in-app touchent le compte du proche et celui du titulaire")
    void resolveTousComptes_procheAvecCompte_lesDeux() {
        // Arrange
        when(patientRepository.findById(PROCHE)).thenReturn(Optional.of(proche(null, PROCHE)));
        avecTitulaire();

        // Act & Assert
        assertThat(service.resolveTousComptes(PROCHE)).containsExactlyInAnyOrder(PROCHE, TITULAIRE);
    }

    @Test
    @DisplayName("un proche sans compte fait remonter la notification au titulaire")
    void resolveTousComptes_procheSansCompte_titulaireSeul() {
        // Arrange
        when(patientRepository.findById(PROCHE)).thenReturn(Optional.of(proche(null, null)));
        avecTitulaire();

        // Act & Assert
        assertThat(service.resolveTousComptes(PROCHE)).containsExactly(TITULAIRE);
    }
}
