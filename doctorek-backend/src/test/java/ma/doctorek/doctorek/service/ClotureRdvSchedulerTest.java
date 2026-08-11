package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.AvisRepository;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ClotureRdvSchedulerTest {

    private static final ZoneId ZONE = ZoneId.of("Africa/Casablanca");

    @Mock private RendezVousRepository rdvRepo;
    @Mock private AvisRepository avisRepo;
    @Mock private UserRepository userRepo;
    @Mock private NotificationService notifications;
    @Mock private NotificationRoutingService notificationRouting;

    private ClotureRdvScheduler scheduler;

    private final UUID medecinId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();
    private final UUID compteId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        scheduler = new ClotureRdvScheduler(
            rdvRepo, avisRepo, userRepo, notifications, notificationRouting, ZONE);
        ReflectionTestUtils.setField(scheduler, "margeClotureMinutes", 0);

        User medecin = User.builder().firstName("Sara").lastName("Bennani").build();
        when(userRepo.findById(medecinId)).thenReturn(Optional.of(medecin));
        when(notificationRouting.resolveTousComptes(patientId)).thenReturn(Set.of(compteId));
    }

    // ── Clôture ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("un rendez-vous passé se clôture sans intervention du médecin")
    void cloture_rdvPasse_devientTermine() {
        RendezVousEntity rdv = rdv(StatutRdv.CONFIRME);
        when(rdvRepo.findACloturer(anyList(), any(), any())).thenReturn(List.of(rdv));

        scheduler.cloturerRdvsPasses();

        assertThat(rdv.getStatut()).isEqualTo(StatutRdv.TERMINE.name());
        verify(rdvRepo).saveAll(List.of(rdv));
    }

    @Test
    @DisplayName("un rendez-vous jamais confirmé se clôture aussi, sinon il resterait bloqué")
    void cloture_rdvJamaisConfirme_devientTermine() {
        ArgumentCaptor<List<String>> statuts = ArgumentCaptor.forClass(List.class);
        when(rdvRepo.findACloturer(anyList(), any(), any())).thenReturn(List.of());

        scheduler.cloturerRdvsPasses();

        verify(rdvRepo).findACloturer(statuts.capture(), any(), any());
        assertThat(statuts.getValue())
            .containsExactlyInAnyOrder(StatutRdv.EN_ATTENTE.name(), StatutRdv.CONFIRME.name());
    }

    @Test
    @DisplayName("les annulés ne sont jamais clôturés")
    void cloture_ignoreLesAnnules() {
        ArgumentCaptor<List<String>> statuts = ArgumentCaptor.forClass(List.class);
        when(rdvRepo.findACloturer(anyList(), any(), any())).thenReturn(List.of());

        scheduler.cloturerRdvsPasses();

        verify(rdvRepo).findACloturer(statuts.capture(), any(), any());
        assertThat(statuts.getValue()).doesNotContain(StatutRdv.ANNULE.name());
    }

    @Test
    @DisplayName("une consultation commencée mais pas finie n'est pas clôturée")
    void cloture_creneauEnCours_pasCloture() {
        LocalDateTime maintenant = LocalDateTime.now(ZONE);
        RendezVousEntity enCours = rdv(StatutRdv.CONFIRME);
        // Commencé il y a 10 minutes, prévu pour 30 : la consultation court encore.
        LocalDateTime debutEnCours = maintenant.minusMinutes(10);
        enCours.setDateRdv(debutEnCours.toLocalDate());
        enCours.setHeureRdv(debutEnCours.toLocalTime());
        enCours.setDuree(30);
        when(rdvRepo.findACloturer(anyList(), any(), any())).thenReturn(List.of(enCours));

        scheduler.cloturerRdvsPasses();

        assertThat(enCours.getStatut()).isEqualTo(StatutRdv.CONFIRME.name());
        verify(rdvRepo, never()).saveAll(any());
    }

    @Test
    @DisplayName("la clôture suit la fin du créneau, pas son début")
    void cloture_creneauEcoule_estCloture() {
        LocalDateTime maintenant = LocalDateTime.now(ZONE);
        RendezVousEntity fini = rdv(StatutRdv.CONFIRME);
        // Commencé il y a 40 minutes pour une durée de 30 : le créneau est écoulé.
        LocalDateTime debutFini = maintenant.minusMinutes(40);
        fini.setDateRdv(debutFini.toLocalDate());
        fini.setHeureRdv(debutFini.toLocalTime());
        fini.setDuree(30);
        when(rdvRepo.findACloturer(anyList(), any(), any())).thenReturn(List.of(fini));

        scheduler.cloturerRdvsPasses();

        assertThat(fini.getStatut()).isEqualTo(StatutRdv.TERMINE.name());
        verify(rdvRepo).saveAll(List.of(fini));
    }

    @Test
    @DisplayName("la marge configurée repousse la clôture d'autant")
    void cloture_margeConfiguree_repousseLaCloture() {
        ReflectionTestUtils.setField(scheduler, "margeClotureMinutes", 60);
        LocalDateTime maintenant = LocalDateTime.now(ZONE);
        RendezVousEntity fini = rdv(StatutRdv.CONFIRME);
        LocalDateTime debutFini = maintenant.minusMinutes(40);
        fini.setDateRdv(debutFini.toLocalDate());
        fini.setHeureRdv(debutFini.toLocalTime());
        fini.setDuree(30);
        when(rdvRepo.findACloturer(anyList(), any(), any())).thenReturn(List.of(fini));

        scheduler.cloturerRdvsPasses();

        assertThat(fini.getStatut()).isEqualTo(StatutRdv.CONFIRME.name());
    }

    @Test
    @DisplayName("aucun rendez-vous à clôturer n'écrit rien")
    void cloture_rienAFaire_aucuneEcriture() {
        when(rdvRepo.findACloturer(anyList(), any(), any())).thenReturn(List.of());

        scheduler.cloturerRdvsPasses();

        verify(rdvRepo, never()).saveAll(any());
    }

    // ── Invitation à noter ─────────────────────────────────────────────────

    @Test
    @DisplayName("le patient est invité à noter la consultation de la veille")
    void invitation_consultationDeLaVeille_notifiee() {
        RendezVousEntity rdv = rdv(StatutRdv.TERMINE);
        when(rdvRepo.findInvitationsAvisEnAttente(any(), eq(StatutRdv.TERMINE.name())))
            .thenReturn(List.of(rdv));
        when(avisRepo.existsByRdvId(rdv.getId())).thenReturn(false);
        when(rdvRepo.reserverInvitationAvis(eq(rdv.getId()), any(Instant.class))).thenReturn(1);

        scheduler.inviterANoter();

        verify(notifications).push(eq(compteId), eq("AVIS_INVITATION"), anyString(), anyString());
    }

    @Test
    @DisplayName("une consultation déjà notée ne relance pas le patient")
    void invitation_dejaNotee_aucuneRelance() {
        RendezVousEntity rdv = rdv(StatutRdv.TERMINE);
        when(rdvRepo.findInvitationsAvisEnAttente(any(), anyString())).thenReturn(List.of(rdv));
        when(avisRepo.existsByRdvId(rdv.getId())).thenReturn(true);

        scheduler.inviterANoter();

        verify(notifications, never()).push(any(), anyString(), anyString(), anyString());
        verify(rdvRepo, never()).reserverInvitationAvis(any(), any());
    }

    @Test
    @DisplayName("un second passage le même jour n'invite pas deux fois")
    void invitation_dejaEnvoyee_aucunDoublon() {
        RendezVousEntity rdv = rdv(StatutRdv.TERMINE);
        when(rdvRepo.findInvitationsAvisEnAttente(any(), anyString())).thenReturn(List.of(rdv));
        when(avisRepo.existsByRdvId(rdv.getId())).thenReturn(false);
        // La réservation atomique a été perdue au profit d'un autre passage.
        when(rdvRepo.reserverInvitationAvis(eq(rdv.getId()), any(Instant.class))).thenReturn(0);

        scheduler.inviterANoter();

        verify(notifications, never()).push(any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("l'invitation porte sur les consultations de la veille")
    void invitation_cibleLaVeille() {
        ArgumentCaptor<LocalDate> date = ArgumentCaptor.forClass(LocalDate.class);
        when(rdvRepo.findInvitationsAvisEnAttente(any(), anyString())).thenReturn(List.of());

        scheduler.inviterANoter();

        verify(rdvRepo).findInvitationsAvisEnAttente(date.capture(), eq(StatutRdv.TERMINE.name()));
        assertThat(date.getValue()).isEqualTo(LocalDate.now(ZONE).minusDays(1));
    }

    private RendezVousEntity rdv(StatutRdv statut) {
        return RendezVousEntity.builder()
            .id(UUID.randomUUID())
            .medecinId(medecinId)
            .patientId(patientId)
            .dateRdv(LocalDate.now(ZONE).minusDays(1))
            .heureRdv(LocalTime.of(9, 0))
            .duree(30)
            .statut(statut.name())
            .build();
    }
}
