package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.AvisResponse;
import ma.doctorek.doctorek.dto.CreerAvisRequest;
import ma.doctorek.doctorek.dto.NoteMedecinResponse;
import ma.doctorek.doctorek.dto.SignalerAvisRequest;
import ma.doctorek.doctorek.entity.AvisEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.enums.StatutAvis;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.exception.AvisInvalideException;
import ma.doctorek.doctorek.exception.AvisNotFoundException;
import ma.doctorek.doctorek.repository.AvisRepository;
import ma.doctorek.doctorek.repository.AvisSignalementRepository;
import ma.doctorek.doctorek.repository.NoteMedecinProjection;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.RepartitionNotesProjection;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AvisServiceTest {

    @Mock private AvisRepository avisRepo;
    @Mock private AvisSignalementRepository signalementRepo;
    @Mock private RendezVousRepository rdvRepo;
    @Mock private PatientRepository patientRepo;
    @Mock private UserRepository userRepo;

    private AvisService service;

    private final UUID compteId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();
    private final UUID medecinId = UUID.randomUUID();
    private final UUID rdvId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new AvisService(avisRepo, signalementRepo, rdvRepo, patientRepo, userRepo);

        PatientEntity patient = new PatientEntity("Benhammou", "Akram", LocalDate.of(1998, Month.APRIL, 12));
        patient.setId(patientId);
        patient.setCompteId(compteId);
        when(patientRepo.findByCompteId(compteId)).thenReturn(Optional.of(patient));
        when(patientRepo.findById(patientId)).thenReturn(Optional.of(patient));

        when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdv(StatutRdv.TERMINE)));
        when(avisRepo.existsByRdvId(rdvId)).thenReturn(false);
        when(avisRepo.save(any(AvisEntity.class))).thenAnswer(i -> {
            AvisEntity a = i.getArgument(0);
            if (a.getId() == null) a.setId(UUID.randomUUID());
            if (a.getStatut() == null) a.setStatut(StatutAvis.PUBLIE.name());
            return a;
        });
    }

    private RendezVousEntity rdv(StatutRdv statut) {
        return RendezVousEntity.builder()
            .id(rdvId)
            .medecinId(medecinId)
            .patientId(patientId)
            .dateRdv(LocalDate.now().minusDays(1))
            .heureRdv(LocalTime.of(10, 0))
            .duree(30)
            .statut(statut.name())
            .build();
    }

    private CreerAvisRequest requete(int note, String commentaire, boolean anonyme) {
        return new CreerAvisRequest(rdvId, note, commentaire, anonyme);
    }

    // ── Dépôt ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("enregistre l'avis d'un patient dont le rendez-vous est terminé")
    void creerAvis_rdvTermine_enregistre() {
        AvisResponse response = service.creerAvis(compteId, requete(5, "Médecin à l'écoute", false));

        ArgumentCaptor<AvisEntity> captor = ArgumentCaptor.forClass(AvisEntity.class);
        verify(avisRepo).save(captor.capture());
        AvisEntity saved = captor.getValue();

        assertThat(saved.getMedecinId()).isEqualTo(medecinId);
        assertThat(saved.getPatientId()).isEqualTo(patientId);
        assertThat(saved.getRdvId()).isEqualTo(rdvId);
        assertThat(saved.getNote()).isEqualTo((short) 5);
        assertThat(response.note()).isEqualTo(5);
    }

    @Test
    @DisplayName("le médecin de l'avis vient du rendez-vous, jamais du client")
    void creerAvis_medecinDeduitDuRdv() {
        service.creerAvis(compteId, requete(4, null, false));

        ArgumentCaptor<AvisEntity> captor = ArgumentCaptor.forClass(AvisEntity.class);
        verify(avisRepo).save(captor.capture());
        assertThat(captor.getValue().getMedecinId()).isEqualTo(medecinId);
    }

    @Test
    @DisplayName("refuse un rendez-vous qui n'est pas terminé")
    void creerAvis_rdvNonTermine_refuse() {
        when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdv(StatutRdv.CONFIRME)));
        CreerAvisRequest requete = requete(5, null, false);

        assertThatThrownBy(() -> service.creerAvis(compteId, requete))
            .isInstanceOf(AvisInvalideException.class);
        verify(avisRepo, never()).save(any());
    }

    @Test
    @DisplayName("refuse un rendez-vous annulé")
    void creerAvis_rdvAnnule_refuse() {
        when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdv(StatutRdv.ANNULE)));
        CreerAvisRequest requete = requete(5, null, false);

        assertThatThrownBy(() -> service.creerAvis(compteId, requete))
            .isInstanceOf(AvisInvalideException.class);
    }

    @Test
    @DisplayName("refuse de noter le rendez-vous d'un autre patient")
    void creerAvis_rdvDunAutrePatient_refuse() {
        RendezVousEntity autre = rdv(StatutRdv.TERMINE);
        autre.setPatientId(UUID.randomUUID());
        when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(autre));
        CreerAvisRequest requete = requete(5, null, false);

        assertThatThrownBy(() -> service.creerAvis(compteId, requete))
            .isInstanceOf(AvisInvalideException.class);
        verify(avisRepo, never()).save(any());
    }

    @Test
    @DisplayName("refuse un second avis sur le même rendez-vous")
    void creerAvis_dejaNote_refuse() {
        when(avisRepo.existsByRdvId(rdvId)).thenReturn(true);
        CreerAvisRequest requete = requete(5, null, false);

        assertThatThrownBy(() -> service.creerAvis(compteId, requete))
            .isInstanceOf(AvisInvalideException.class);
        verify(avisRepo, never()).save(any());
    }

    @Test
    @DisplayName("traduit la violation de l'index unique en refus métier")
    void creerAvis_courseSurLIndexUnique_refuse() {
        when(avisRepo.save(any(AvisEntity.class)))
            .thenThrow(new DataIntegrityViolationException("uq_avis_rdv"));
        CreerAvisRequest requete = requete(5, null, false);

        assertThatThrownBy(() -> service.creerAvis(compteId, requete))
            .isInstanceOf(AvisInvalideException.class);
    }

    @Test
    @DisplayName("refuse une note hors de l'échelle 1-5")
    void creerAvis_noteHorsEchelle_refuse() {
        CreerAvisRequest tropHaute = requete(6, null, false);
        CreerAvisRequest tropBasse = requete(0, null, false);

        assertThatThrownBy(() -> service.creerAvis(compteId, tropHaute))
            .isInstanceOf(AvisInvalideException.class);
        assertThatThrownBy(() -> service.creerAvis(compteId, tropBasse))
            .isInstanceOf(AvisInvalideException.class);
    }

    @Test
    @DisplayName("normalise un commentaire vide en absence de commentaire")
    void creerAvis_commentaireBlanc_devientNull() {
        service.creerAvis(compteId, requete(4, "   ", false));

        ArgumentCaptor<AvisEntity> captor = ArgumentCaptor.forClass(AvisEntity.class);
        verify(avisRepo).save(captor.capture());
        assertThat(captor.getValue().getCommentaire()).isNull();
    }

    @Test
    @DisplayName("un avis anonyme n'expose pas le nom de son auteur")
    void creerAvis_anonyme_masqueLAuteur() {
        AvisResponse response = service.creerAvis(compteId, requete(3, "Correct", true));

        assertThat(response.auteur()).isEqualTo("Patient vérifié");
        assertThat(response.auteur()).doesNotContain("Akram");
    }

    @Test
    @DisplayName("un avis signé affiche le prénom et l'initiale, pas le nom complet")
    void creerAvis_signe_afficheInitiale() {
        AvisResponse response = service.creerAvis(compteId, requete(5, "Parfait", false));

        assertThat(response.auteur()).isEqualTo("Akram B.");
        assertThat(response.auteur()).doesNotContain("Benhammou");
    }

    // ── Éligibilité ────────────────────────────────────────────────────────

    @Test
    @DisplayName("ne propose de noter que les rendez-vous terminés et pas encore notés")
    void rdvsNotables_filtreLesTerminesNonNotes() {
        UUID rdvDejaNote = UUID.randomUUID();
        UUID rdvEnCours = UUID.randomUUID();

        RendezVousEntity note = rdv(StatutRdv.TERMINE);
        note.setId(rdvDejaNote);
        RendezVousEntity enCours = rdv(StatutRdv.CONFIRME);
        enCours.setId(rdvEnCours);

        List<UUID> candidats = List.of(rdvId, rdvDejaNote, rdvEnCours);
        when(rdvRepo.findAllById(candidats)).thenReturn(List.of(rdv(StatutRdv.TERMINE), note, enCours));
        when(avisRepo.findRdvIdsNotes(List.of(patientId))).thenReturn(List.of(rdvDejaNote));

        assertThat(service.filtrerRdvsNotables(compteId, candidats)).containsExactly(rdvId);
    }

    @Test
    @DisplayName("ne propose jamais de noter le rendez-vous d'un autre patient")
    void rdvsNotables_ignoreLesRdvDautrui() {
        RendezVousEntity autrui = rdv(StatutRdv.TERMINE);
        autrui.setPatientId(UUID.randomUUID());

        List<UUID> candidats = List.of(rdvId);
        when(rdvRepo.findAllById(candidats)).thenReturn(List.of(autrui));
        when(avisRepo.findRdvIdsNotes(List.of(patientId))).thenReturn(List.of());

        assertThat(service.filtrerRdvsNotables(compteId, candidats)).isEmpty();
    }

    // ── Signalement ────────────────────────────────────────────────────────

    @Test
    @DisplayName("un signalement bascule l'avis en file de modération sans le dépublier")
    void signaler_basculeEnSignale() {
        AvisEntity avis = AvisEntity.builder()
            .id(UUID.randomUUID()).medecinId(medecinId).patientId(patientId).rdvId(rdvId)
            .note((short) 1).statut(StatutAvis.PUBLIE.name()).build();
        when(avisRepo.findById(avis.getId())).thenReturn(Optional.of(avis));
        when(signalementRepo.existsByAvisIdAndAuteurId(avis.getId(), compteId)).thenReturn(false);

        service.signaler(avis.getId(), compteId, new SignalerAvisRequest("Propos injurieux"));

        assertThat(avis.getStatut()).isEqualTo(StatutAvis.SIGNALE.name());
        verify(signalementRepo).save(any());
    }

    @Test
    @DisplayName("un même compte ne signale pas deux fois le même avis")
    void signaler_deuxFois_refuse() {
        UUID avisId = UUID.randomUUID();
        AvisEntity avis = AvisEntity.builder()
            .id(avisId).medecinId(medecinId).patientId(patientId).rdvId(rdvId)
            .note((short) 1).statut(StatutAvis.SIGNALE.name()).build();
        when(avisRepo.findById(avisId)).thenReturn(Optional.of(avis));
        when(signalementRepo.existsByAvisIdAndAuteurId(avisId, compteId)).thenReturn(true);
        SignalerAvisRequest signalement = new SignalerAvisRequest(null);

        assertThatThrownBy(() -> service.signaler(avisId, compteId, signalement))
            .isInstanceOf(AvisInvalideException.class);
        verify(signalementRepo, never()).save(any());
    }

    @Test
    @DisplayName("signaler un avis inexistant remonte un 404")
    void signaler_avisInconnu_404() {
        UUID inconnu = UUID.randomUUID();
        when(avisRepo.findById(inconnu)).thenReturn(Optional.empty());
        SignalerAvisRequest signalement = new SignalerAvisRequest(null);

        assertThatThrownBy(() -> service.signaler(inconnu, compteId, signalement))
            .isInstanceOf(AvisNotFoundException.class);
    }

    // ── Modération ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("masquer retire l'avis de la vue publique")
    void masquer_retireDeLaVuePublique() {
        UUID avisId = UUID.randomUUID();
        AvisEntity avis = AvisEntity.builder()
            .id(avisId).medecinId(medecinId).patientId(patientId).rdvId(rdvId)
            .note((short) 1).statut(StatutAvis.SIGNALE.name()).build();
        when(avisRepo.findById(avisId)).thenReturn(Optional.of(avis));

        service.modererAvis(avisId, StatutAvis.MASQUE);

        assertThat(avis.getStatut()).isEqualTo(StatutAvis.MASQUE.name());
    }

    @Test
    @DisplayName("republier remet un avis signalé à tort en ligne")
    void republier_remetEnLigne() {
        UUID avisId = UUID.randomUUID();
        AvisEntity avis = AvisEntity.builder()
            .id(avisId).medecinId(medecinId).patientId(patientId).rdvId(rdvId)
            .note((short) 4).statut(StatutAvis.SIGNALE.name()).build();
        when(avisRepo.findById(avisId)).thenReturn(Optional.of(avis));

        service.modererAvis(avisId, StatutAvis.PUBLIE);

        assertThat(avis.getStatut()).isEqualTo(StatutAvis.PUBLIE.name());
    }

    // ── Synthèse ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("la répartition couvre les cinq notes, y compris celles jamais attribuées")
    void repartition_couvreLesCinqNotes() {
        when(avisRepo.repartitionParMedecin(medecinId)).thenReturn(List.of(
            projection((short) 5, 3),
            projection((short) 3, 1)));

        List<Integer> repartition = service.repartition(medecinId);

        assertThat(repartition).containsExactly(0, 0, 1, 0, 3);
    }

    @Test
    @DisplayName("un médecin sans avis n'affiche pas une moyenne de zéro")
    void syntheseSansAvis_moyenneNulle() {
        when(avisRepo.moyenneParMedecin(medecinId)).thenReturn(null);
        when(avisRepo.countByMedecinIdAndStatutNot(medecinId, StatutAvis.MASQUE.name())).thenReturn(0L);

        assertThat(service.noteMoyenne(medecinId)).isNull();
    }

    @Test
    @DisplayName("la moyenne est arrondie au dixième")
    void moyenne_arrondieAuDixieme() {
        when(avisRepo.moyenneParMedecin(medecinId)).thenReturn(4.2666);

        assertThat(service.noteMoyenne(medecinId)).isEqualTo(4.3);
    }

    // ── Notes des cartes de recherche ──────────────────────────────────────

    @Test
    @DisplayName("les notes d'une page de résultats tiennent en une seule requête")
    void notesParMedecins_uneSeuleRequete() {
        UUID autreMedecin = UUID.randomUUID();
        when(avisRepo.notesParMedecins(List.of(medecinId, autreMedecin))).thenReturn(List.of(
            noteMedecin(medecinId, 4.2666, 9),
            noteMedecin(autreMedecin, 5.0, 2)));

        List<NoteMedecinResponse> notes = service.notesParMedecins(List.of(medecinId, autreMedecin));

        assertThat(notes).containsExactly(
            new NoteMedecinResponse(medecinId, 4.3, 9),
            new NoteMedecinResponse(autreMedecin, 5.0, 2));
        verify(avisRepo).notesParMedecins(List.of(medecinId, autreMedecin));
    }

    @Test
    @DisplayName("un médecin sans avis est absent de la réponse plutôt que noté zéro")
    void notesParMedecins_medecinSansAvis_absent() {
        UUID sansAvis = UUID.randomUUID();
        when(avisRepo.notesParMedecins(List.of(medecinId, sansAvis)))
            .thenReturn(List.of(noteMedecin(medecinId, 4.0, 1)));

        List<NoteMedecinResponse> notes = service.notesParMedecins(List.of(medecinId, sansAvis));

        assertThat(notes).extracting(NoteMedecinResponse::medecinId).containsExactly(medecinId);
    }

    @Test
    @DisplayName("une liste vide ne déclenche aucune requête")
    void notesParMedecins_listeVide_aucuneRequete() {
        assertThat(service.notesParMedecins(List.of())).isEmpty();

        verify(avisRepo, never()).notesParMedecins(any());
    }

    @Test
    @DisplayName("un lot plus large qu'une page de résultats est refusé")
    void notesParMedecins_lotTropLarge_refuse() {
        List<UUID> trop = new ArrayList<>();
        for (int i = 0; i < 61; i++) trop.add(UUID.randomUUID());

        assertThatThrownBy(() -> service.notesParMedecins(trop))
            .isInstanceOf(AvisInvalideException.class);
        verify(avisRepo, never()).notesParMedecins(any());
    }

    private NoteMedecinProjection noteMedecin(UUID id, double moyenne, long total) {
        return new NoteMedecinProjection() {
            @Override public UUID getMedecinId() { return id; }
            @Override public double getMoyenne() { return moyenne; }
            @Override public long getTotal() { return total; }
        };
    }

    private RepartitionNotesProjection projection(short note, long total) {
        return new RepartitionNotesProjection() {
            @Override public short getNote() { return note; }
            @Override public long getTotal() { return total; }
        };
    }
}
