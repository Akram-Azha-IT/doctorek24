package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.ProcheResponse;
import ma.doctorek.doctorek.dto.ReclamerRattachementRequest;
import ma.doctorek.doctorek.entity.GestionEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.entity.RattachementTokenEntity;
import ma.doctorek.doctorek.enums.RoleGestion;
import ma.doctorek.doctorek.exception.RattachementInvalideException;
import ma.doctorek.doctorek.repository.GestionRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import ma.doctorek.doctorek.repository.RattachementTokenRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RattachementServiceTest {

    @Mock private RattachementTokenRepository tokenRepo;
    @Mock private PatientRepository patientRepo;
    @Mock private GestionRepository gestionRepo;
    @Mock private RendezVousRepository rdvRepo;
    @Mock private UserRepository userRepo;
    @Mock private PatientPivotService patientPivotService;
    @Mock private ma.doctorek.doctorek.repository.OrdonnanceRepository ordonnanceRepo;
    @Mock private ma.doctorek.doctorek.repository.DocumentMedicalRepository documentRepo;
    @Mock private ma.doctorek.doctorek.notification.NotificationService notificationService;

    private RattachementService service;

    private final UUID tokenId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();
    private final UUID requesterId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new RattachementService(tokenRepo, patientRepo, gestionRepo, rdvRepo, userRepo,
            patientPivotService, ordonnanceRepo, documentRepo, notificationService);
    }

    private PatientEntity patient(String nom, UUID compteId) {
        PatientEntity p = new PatientEntity(nom, "Élyès", LocalDate.of(2015, 6, 1));
        p.setId(patientId);
        p.setCompteId(compteId);
        return p;
    }

    private RattachementTokenEntity token(int tentatives, Instant expiresAt, Instant usedAt) {
        RattachementTokenEntity t = new RattachementTokenEntity(patientId, null, expiresAt);
        t.setToken(tokenId);
        t.setTentatives(tentatives);
        t.setUsedAt(usedAt);
        return t;
    }

    private RattachementTokenEntity tokenValide() {
        return token(0, Instant.now().plus(30, ChronoUnit.DAYS), null);
    }

    private ReclamerRattachementRequest request(String lettres) {
        return new ReclamerRattachementRequest(lettres, false, RoleGestion.PARENT, true);
    }

    private void stubToken(RattachementTokenEntity t) {
        when(tokenRepo.findById(tokenId)).thenReturn(Optional.of(t));
        lenient().when(tokenRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("lettres correctes avec accents et casse (Élyès-Benali → 'ely') : rattachement réussi")
    void reclamer_accentInsensitiveMatch_createsGestion() {
        RattachementTokenEntity t = tokenValide();
        stubToken(t);
        when(patientRepo.findById(patientId)).thenReturn(Optional.of(patient("Élyès-Benali", null)));
        when(gestionRepo.findByGestionnaireCompteIdAndPatientIdAndActifTrue(requesterId, patientId))
            .thenReturn(Optional.empty());
        when(gestionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProcheResponse result = service.reclamer(tokenId, requesterId, request("ELY"));

        assertThat(result.id()).isEqualTo(patientId);
        assertThat(t.estUtilise()).isTrue();
        verify(gestionRepo).save(any(GestionEntity.class));
    }

    @Test
    @DisplayName("mauvaises lettres : tentative incrémentée, 400 avec tentatives restantes")
    void reclamer_wrongLetters_incrementsAttempts() {
        RattachementTokenEntity t = tokenValide();
        stubToken(t);
        when(patientRepo.findById(patientId)).thenReturn(Optional.of(patient("Benali", null)));

        assertThatThrownBy(() -> service.reclamer(tokenId, requesterId, request("XYZ")))
            .isInstanceOf(RattachementInvalideException.class)
            .hasMessageContaining("4 tentative");

        assertThat(t.getTentatives()).isEqualTo(1);
        verify(gestionRepo, never()).save(any());
    }

    @Test
    @DisplayName("5e échec : token bloqué")
    void reclamer_fifthFailure_blocksToken() {
        RattachementTokenEntity t = token(4, Instant.now().plus(1, ChronoUnit.DAYS), null);
        stubToken(t);
        when(patientRepo.findById(patientId)).thenReturn(Optional.of(patient("Benali", null)));

        assertThatThrownBy(() -> service.reclamer(tokenId, requesterId, request("XYZ")))
            .isInstanceOf(RattachementInvalideException.class)
            .hasMessageContaining("bloqué");
        assertThat(t.getTentatives()).isEqualTo(5);
    }

    @Test
    @DisplayName("token déjà bloqué : refus immédiat sans vérification")
    void reclamer_alreadyBlocked_rejects() {
        stubToken(token(5, Instant.now().plus(1, ChronoUnit.DAYS), null));

        assertThatThrownBy(() -> service.reclamer(tokenId, requesterId, request("BEN")))
            .isInstanceOf(RattachementInvalideException.class)
            .hasMessageContaining("bloqué");
    }

    @Test
    @DisplayName("token expiré : refus")
    void reclamer_expired_rejects() {
        stubToken(token(0, Instant.now().minus(1, ChronoUnit.DAYS), null));

        assertThatThrownBy(() -> service.reclamer(tokenId, requesterId, request("BEN")))
            .isInstanceOf(RattachementInvalideException.class)
            .hasMessageContaining("expiré");
    }

    @Test
    @DisplayName("token déjà utilisé : refus")
    void reclamer_used_rejects() {
        stubToken(token(0, Instant.now().plus(1, ChronoUnit.DAYS), Instant.now()));

        assertThatThrownBy(() -> service.reclamer(tokenId, requesterId, request("BEN")))
            .isInstanceOf(RattachementInvalideException.class)
            .hasMessageContaining("déjà été utilisé");
    }

    @Test
    @DisplayName("patient a obtenu son propre compte entre-temps : conflit")
    void reclamer_patientGotOwnAccount_conflicts() {
        stubToken(tokenValide());
        when(patientRepo.findById(patientId)).thenReturn(Optional.of(patient("Benali", UUID.randomUUID())));

        assertThatThrownBy(() -> service.reclamer(tokenId, requesterId, request("BEN")))
            .isInstanceOf(RattachementInvalideException.class)
            .hasMessageContaining("propre compte");
    }

    @Test
    @DisplayName("pourMoi : fusion — RDV/ordonnances/documents réaffectés, fiche orpheline supprimée, notif poussée")
    void reclamer_pourMoi_mergesIntoOwnProfile() {
        RattachementTokenEntity t = tokenValide();
        stubToken(t);
        PatientEntity orphelin = patient("Benali", null);
        when(patientRepo.findById(patientId)).thenReturn(Optional.of(orphelin));

        UUID selfId = UUID.randomUUID();
        PatientEntity self = new PatientEntity("Benali", "Karim", null);
        self.setId(selfId);
        self.setCompteId(requesterId);
        when(patientPivotService.getOrCreateSelf(requesterId)).thenReturn(self);

        ProcheResponse result = service.reclamer(tokenId, requesterId,
            new ReclamerRattachementRequest("BEN", true, null, null));

        assertThat(result.self()).isTrue();
        assertThat(result.id()).isEqualTo(selfId);
        verify(rdvRepo).reassignPatient(patientId, selfId);
        verify(ordonnanceRepo).reassignPatient(patientId, selfId);
        verify(documentRepo).reassignPatient(patientId, selfId);
        verify(patientRepo).delete(orphelin);
        verify(gestionRepo, never()).save(any());
        verify(notificationService).push(org.mockito.ArgumentMatchers.eq(requesterId),
            org.mockito.ArgumentMatchers.eq("RDV_RATTACHE"),
            org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("proche sans rôle ni déclaration : refus")
    void reclamer_procheWithoutRole_rejects() {
        stubToken(tokenValide());
        when(patientRepo.findById(patientId)).thenReturn(Optional.of(patient("Benali", null)));

        assertThatThrownBy(() -> service.reclamer(tokenId, requesterId,
                new ReclamerRattachementRequest("BEN", false, null, null)))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("obligatoires");
    }

    @Test
    @DisplayName("creerTokenSiEligible : refuse patient avec compte, avec gestionnaire, ou sans email")
    void creerTokenSiEligible_ineligibleCases_returnEmpty() {
        PatientEntity avecCompte = patient("Benali", UUID.randomUUID());
        avecCompte.setEmail("x@y.z");
        assertThat(service.creerTokenSiEligible(avecCompte, null)).isEmpty();

        PatientEntity sansEmail = patient("Benali", null);
        sansEmail.setEmail(null);
        lenient().when(gestionRepo.findByPatientIdAndActifTrue(patientId)).thenReturn(List.of());
        assertThat(service.creerTokenSiEligible(sansEmail, null)).isEmpty();

        PatientEntity avecGestionnaire = patient("Benali", null);
        avecGestionnaire.setEmail("x@y.z");
        when(gestionRepo.findByPatientIdAndActifTrue(patientId))
            .thenReturn(List.of(new GestionEntity(requesterId, patientId, RoleGestion.PARENT, true)));
        assertThat(service.creerTokenSiEligible(avecGestionnaire, null)).isEmpty();
    }

    @Test
    @DisplayName("creerTokenSiEligible : patient sans compte, sans gestionnaire, avec email → token")
    void creerTokenSiEligible_eligible_createsToken() {
        PatientEntity eligible = patient("Benali", null);
        eligible.setEmail("famille@mail.com");
        when(gestionRepo.findByPatientIdAndActifTrue(patientId)).thenReturn(List.of());
        when(tokenRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Optional<RattachementTokenEntity> result = service.creerTokenSiEligible(eligible, null);

        assertThat(result).isPresent();
        assertThat(result.get().getPatientId()).isEqualTo(patientId);
        assertThat(result.get().estExpire()).isFalse();
    }
}
