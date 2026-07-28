package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.entity.DisponibiliteEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
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
import org.springframework.data.domain.PageImpl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Month;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Réservation d'un rendez-vous : auteur enregistré et praticien prévenu.
 *
 * <p>Le rendez-vous ne retenait que le patient concerné : le médecin ne pouvait pas
 * savoir qu'un titulaire avait réservé pour un proche, et n'était averti de rien.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AgendaServiceReservationTest {

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
    private static final LocalDate DATE = LocalDate.of(2026, Month.SEPTEMBER, 15);
    private static final LocalTime HEURE = LocalTime.of(10, 0);

    @BeforeEach
    void setUp() {
        agendaService = new AgendaService(dispoRepo, rdvRepo, userRepo, patientRepo, emailService,
            questionnaireSerializer, accesPatientService, notificationRouting, rattachementService,
            patientPivotService, notificationService, "https://app.test");

        DisponibiliteEntity dispo = new DisponibiliteEntity();
        dispo.setDureeConsultation(30);
        when(dispoRepo.findByMedecinIdAndJourSemaine(eq(MEDECIN), anyString())).thenReturn(Optional.of(dispo));
        when(rdvRepo.existsByMedecinIdAndDateRdvAndHeureRdv(any(), any(), any())).thenReturn(false);
        when(rdvRepo.save(any(RendezVousEntity.class))).thenAnswer(i -> {
            RendezVousEntity r = i.getArgument(0);
            if (r.getId() == null) r.setId(UUID.randomUUID());
            return r;
        });
        when(notificationRouting.resolveEmail(any())).thenReturn(Optional.of("patient@test.ma"));
        when(patientRepo.findById(PATIENT)).thenReturn(Optional.of(patient("Yassine", "Alaoui")));
    }

    private PatientEntity patient(String prenom, String nom) {
        PatientEntity p = new PatientEntity(nom, prenom, null);
        p.setId(PATIENT);
        return p;
    }

    private User user(UUID id, String prenom, String nom) {
        return User.builder().id(id).email(prenom + "@test.ma").password("x")
            .firstName(prenom).lastName(nom).role(Role.PATIENT).build();
    }

    private PrendreRdvRequest request() {
        return new PrendreRdvRequest(MEDECIN, PATIENT, DATE, HEURE, "Contrôle", null);
    }

    private RendezVousEntity savedRdv() {
        ArgumentCaptor<RendezVousEntity> captor = ArgumentCaptor.forClass(RendezVousEntity.class);
        verify(rdvRepo).save(captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("la réservation retient le compte qui l'a effectuée")
    void prendreRdv_enregistreLAuteur() {
        agendaService.prendreRdv(request(), TITULAIRE);

        assertThat(savedRdv().getCreePar()).isEqualTo(TITULAIRE);
    }

    @Test
    @DisplayName("le médecin est prévenu d'un nouveau rendez-vous")
    void prendreRdv_notifieLeMedecin() {
        agendaService.prendreRdv(request(), PATIENT);

        verify(notificationService).push(eq(MEDECIN), eq("RDV_PRIS_PATIENT"), anyString(), anyString());
    }

    @Test
    @DisplayName("quand le patient réserve pour lui-même, la notification le nomme")
    void prendreRdv_pourSoi_nommeLePatient() {
        agendaService.prendreRdv(request(), PATIENT);

        ArgumentCaptor<String> corps = ArgumentCaptor.forClass(String.class);
        verify(notificationService).push(any(), anyString(), anyString(), corps.capture());
        assertThat(corps.getValue()).startsWith("Yassine Alaoui a réservé");
    }

    @Test
    @DisplayName("quand un titulaire réserve pour un proche, la notification le signale")
    void prendreRdv_pourUnProche_nommeLAuteurEtLePatient() {
        when(userRepo.findById(TITULAIRE)).thenReturn(Optional.of(user(TITULAIRE, "Fatima", "Ben")));

        agendaService.prendreRdv(request(), TITULAIRE);

        ArgumentCaptor<String> corps = ArgumentCaptor.forClass(String.class);
        verify(notificationService).push(any(), anyString(), anyString(), corps.capture());
        assertThat(corps.getValue()).contains("Fatima Ben a réservé pour Yassine Alaoui");
    }

    @Test
    @DisplayName("un échec de notification ne fait pas échouer la réservation")
    void prendreRdv_notificationEnErreur_reserveQuandMeme() {
        doThrow(new IllegalStateException("indisponible"))
            .when(notificationService).push(any(), anyString(), anyString(), anyString());

        var res = agendaService.prendreRdv(request(), PATIENT);

        assertThat(res.id()).isNotNull();
    }

    @Test
    @DisplayName("l'agenda nomme l'auteur tiers d'un rendez-vous")
    void getRdvsMedecin_exposeLAuteurTiers() {
        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setId(UUID.randomUUID());
        rdv.setMedecinId(MEDECIN);
        rdv.setPatientId(PATIENT);
        rdv.setDateRdv(DATE);
        rdv.setHeureRdv(HEURE);
        rdv.setDuree(30);
        rdv.setStatut("CONFIRME");
        rdv.setCreePar(TITULAIRE);
        when(rdvRepo.findByMedecinId(eq(MEDECIN), any())).thenReturn(new PageImpl<>(List.of(rdv)));
        when(userRepo.findAllById(any())).thenReturn(List.of(user(TITULAIRE, "Fatima", "Ben")));

        var rdvs = agendaService.getRdvsMedecin(MEDECIN);

        assertThat(rdvs).singleElement()
            .satisfies(r -> assertThat(r.creeParNom()).isEqualTo("Fatima Ben"));
    }

    @Test
    @DisplayName("un rendez-vous pris par le patient lui-même n'affiche aucun auteur tiers")
    void getRdvsMedecin_reservationParLePatient_pasDAuteur() {
        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setId(UUID.randomUUID());
        rdv.setMedecinId(MEDECIN);
        rdv.setPatientId(PATIENT);
        rdv.setDateRdv(DATE);
        rdv.setHeureRdv(HEURE);
        rdv.setDuree(30);
        rdv.setStatut("CONFIRME");
        rdv.setCreePar(PATIENT);
        when(rdvRepo.findByMedecinId(eq(MEDECIN), any())).thenReturn(new PageImpl<>(List.of(rdv)));

        var rdvs = agendaService.getRdvsMedecin(MEDECIN);

        assertThat(rdvs).singleElement()
            .satisfies(r -> assertThat(r.creeParNom()).isNull());
        // Aucun auteur tiers : inutile d'interroger les comptes.
        verify(userRepo, never()).findAllById(any());
    }

    @Test
    @DisplayName("les rendez-vous antérieurs, sans auteur connu, restent affichables")
    void getRdvsMedecin_sansAuteur_resteAffichable() {
        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setId(UUID.randomUUID());
        rdv.setMedecinId(MEDECIN);
        rdv.setPatientId(PATIENT);
        rdv.setDateRdv(DATE);
        rdv.setHeureRdv(HEURE);
        rdv.setDuree(30);
        rdv.setStatut("CONFIRME");
        when(rdvRepo.findByMedecinId(eq(MEDECIN), any())).thenReturn(new PageImpl<>(List.of(rdv)));

        var rdvs = agendaService.getRdvsMedecin(MEDECIN);

        assertThat(rdvs).singleElement().satisfies(r -> {
            assertThat(r.creeParNom()).isNull();
            assertThat(r.patientPrenom()).isEqualTo("Yassine");
        });
    }
}
