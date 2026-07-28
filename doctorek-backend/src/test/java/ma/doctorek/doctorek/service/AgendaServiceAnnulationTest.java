package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.exception.AccesPatientRefuseException;
import ma.doctorek.doctorek.exception.RdvNonAnnulableException;
import ma.doctorek.doctorek.exception.RendezVousNotFoundException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.DisponibiliteRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Annulation d'un rendez-vous : qui a le droit, et qui est prévenu.
 *
 * <p>L'endpoint ne vérifiait auparavant aucune appartenance : connaître un identifiant
 * suffisait à annuler le rendez-vous d'autrui. Ces cas verrouillent le contrôle d'accès.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AgendaServiceAnnulationTest {

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
    private static final UUID PATIENT = UUID.randomUUID();
    private static final UUID TITULAIRE = UUID.randomUUID();
    private static final UUID INTRUS = UUID.randomUUID();
    private static final UUID RDV_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        agendaService = new AgendaService(dispoRepo, rdvRepo, userRepo, patientRepo, emailService,
            questionnaireSerializer, accesPatientService, notificationRouting, rattachementService,
            patientPivotService, notificationService, "https://app.test");
    }

    private RendezVousEntity rdv(StatutRdv statut) {
        RendezVousEntity r = new RendezVousEntity();
        r.setId(RDV_ID);
        r.setMedecinId(MEDECIN);
        r.setPatientId(PATIENT);
        r.setDateRdv(LocalDate.of(2026, 8, 12));
        r.setHeureRdv(LocalTime.of(10, 0));
        r.setDuree(30);
        r.setStatut(statut.name());
        return r;
    }

    private void givenRdv(StatutRdv statut) {
        RendezVousEntity r = rdv(statut);
        when(rdvRepo.findById(RDV_ID)).thenReturn(Optional.of(r));
        when(rdvRepo.save(any(RendezVousEntity.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    @DisplayName("le patient annule son propre rendez-vous")
    void annuler_parLePatient_reussit() {
        givenRdv(StatutRdv.CONFIRME);

        var res = agendaService.annulerRdv(RDV_ID, PATIENT);

        assertThat(res.statut()).isEqualTo(StatutRdv.ANNULE.name());
        verify(accesPatientService).verifierAcces(PATIENT, PATIENT);
    }

    @Test
    @DisplayName("le titulaire annule le rendez-vous du proche qu'il gère")
    void annuler_parLeTitulaire_reussit() {
        givenRdv(StatutRdv.CONFIRME);

        var res = agendaService.annulerRdv(RDV_ID, TITULAIRE);

        assertThat(res.statut()).isEqualTo(StatutRdv.ANNULE.name());
        verify(accesPatientService).verifierAcces(TITULAIRE, PATIENT);
    }

    @Test
    @DisplayName("un tiers sans lien avec le patient ne peut pas annuler")
    void annuler_parUnTiers_refuse() {
        givenRdv(StatutRdv.CONFIRME);
        doThrow(new AccesPatientRefuseException(PATIENT))
            .when(accesPatientService).verifierAcces(INTRUS, PATIENT);

        assertThatThrownBy(() -> agendaService.annulerRdv(RDV_ID, INTRUS))
            .isInstanceOf(AccesPatientRefuseException.class);

        verify(rdvRepo, never()).save(any());
    }

    @Test
    @DisplayName("le médecin annule sans passer par le contrôle patient")
    void annuler_parLeMedecin_reussit() {
        givenRdv(StatutRdv.CONFIRME);

        var res = agendaService.annulerRdv(RDV_ID, MEDECIN);

        assertThat(res.statut()).isEqualTo(StatutRdv.ANNULE.name());
        verify(accesPatientService, never()).verifierAcces(any(), any());
    }

    @Test
    @DisplayName("une annulation par le patient prévient le médecin")
    void annuler_parLePatient_notifieLeMedecin() {
        givenRdv(StatutRdv.CONFIRME);

        agendaService.annulerRdv(RDV_ID, PATIENT);

        verify(notificationService).push(eq(MEDECIN), eq("RDV_ANNULE_PATIENT"), anyString(), anyString());
    }

    @Test
    @DisplayName("le médecin qui annule ne se notifie pas lui-même")
    void annuler_parLeMedecin_neSeNotifiePas() {
        givenRdv(StatutRdv.CONFIRME);

        agendaService.annulerRdv(RDV_ID, MEDECIN);

        verify(notificationService, never()).push(any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("un rendez-vous déjà annulé ne peut pas l'être deux fois")
    void annuler_dejaAnnule_refuse() {
        givenRdv(StatutRdv.ANNULE);

        assertThatThrownBy(() -> agendaService.annulerRdv(RDV_ID, PATIENT))
            .isInstanceOf(RdvNonAnnulableException.class);
    }

    @Test
    @DisplayName("un rendez-vous inexistant remonte une erreur explicite")
    void annuler_inexistant_erreur() {
        when(rdvRepo.findById(RDV_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> agendaService.annulerRdv(RDV_ID, PATIENT))
            .isInstanceOf(RendezVousNotFoundException.class);
    }
}
