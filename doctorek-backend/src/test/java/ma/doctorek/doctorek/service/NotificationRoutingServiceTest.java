package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.GestionEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.User;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationRoutingServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private GestionRepository gestionRepository;
    @Mock private UserRepository userRepository;

    private NotificationRoutingService service;

    private final UUID patientId = UUID.randomUUID();
    private final UUID gestionnaireId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new NotificationRoutingService(patientRepository, gestionRepository, userRepository);
    }

    private PatientEntity patient(LocalDate dateNaissance, String email, UUID compteId) {
        PatientEntity p = new PatientEntity("Alaoui", "Nora", dateNaissance);
        p.setEmail(email);
        p.setCompteId(compteId);
        return p;
    }

    private void stubGestionnaire() {
        GestionEntity gestion = new GestionEntity(gestionnaireId, patientId, RoleGestion.PARENT, true);
        when(gestionRepository.findByPatientIdAndActifTrue(patientId)).thenReturn(List.of(gestion));
        User gestionnaire = User.builder().email("parent@mail.com").build();
        when(userRepository.findById(gestionnaireId)).thenReturn(Optional.of(gestionnaire));
    }

    @Test
    @DisplayName("majeur avec email → notifié directement")
    void resolveEmail_adultWithEmail_returnsPatientEmail() {
        when(patientRepository.findById(patientId))
            .thenReturn(Optional.of(patient(LocalDate.now().minusYears(30), "nora@mail.com", null)));

        assertThat(service.resolveEmail(patientId)).contains("nora@mail.com");
    }

    @Test
    @DisplayName("mineur → le gestionnaire reçoit, même si email renseigné")
    void resolveEmail_minor_routesToGestionnaire() {
        when(patientRepository.findById(patientId))
            .thenReturn(Optional.of(patient(LocalDate.now().minusYears(10), "enfant@mail.com", null)));
        stubGestionnaire();

        assertThat(service.resolveEmail(patientId)).contains("parent@mail.com");
    }

    @Test
    @DisplayName("majeur sans email → le gestionnaire reçoit")
    void resolveEmail_adultWithoutEmail_routesToGestionnaire() {
        when(patientRepository.findById(patientId))
            .thenReturn(Optional.of(patient(LocalDate.now().minusYears(40), null, null)));
        stubGestionnaire();

        assertThat(service.resolveEmail(patientId)).contains("parent@mail.com");
    }

    @Test
    @DisplayName("date de naissance NULL → traité comme majeur")
    void resolveEmail_nullBirthDate_treatedAsAdult() {
        when(patientRepository.findById(patientId))
            .thenReturn(Optional.of(patient(null, "titulaire@mail.com", patientId)));

        assertThat(service.resolveEmail(patientId)).contains("titulaire@mail.com");
    }

    @Test
    @DisplayName("aucun gestionnaire → vide, sans exception")
    void resolveEmail_noGestionnaire_returnsEmpty() {
        when(patientRepository.findById(patientId))
            .thenReturn(Optional.of(patient(LocalDate.now().minusYears(5), null, null)));
        when(gestionRepository.findByPatientIdAndActifTrue(patientId)).thenReturn(List.of());

        assertThat(service.resolveEmail(patientId)).isEmpty();
    }

    @Test
    @DisplayName("notif in-app : compte propre prioritaire, sinon gestionnaire")
    void resolveCompteUserId_prefersOwnAccount() {
        UUID compteId = UUID.randomUUID();
        when(patientRepository.findById(patientId))
            .thenReturn(Optional.of(patient(null, null, compteId)));

        assertThat(service.resolveCompteUserId(patientId)).contains(compteId);
    }

    @Test
    @DisplayName("notif in-app : proche sans compte → gestionnaire")
    void resolveCompteUserId_procheWithoutAccount_routesToGestionnaire() {
        when(patientRepository.findById(patientId))
            .thenReturn(Optional.of(patient(LocalDate.now().minusYears(8), null, null)));
        GestionEntity gestion = new GestionEntity(gestionnaireId, patientId, RoleGestion.PARENT, true);
        when(gestionRepository.findByPatientIdAndActifTrue(patientId)).thenReturn(List.of(gestion));

        assertThat(service.resolveCompteUserId(patientId)).contains(gestionnaireId);
    }
}
