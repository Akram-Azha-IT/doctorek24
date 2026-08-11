package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.ConsentementEntity;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.SourceConsentement;
import ma.doctorek.doctorek.repository.ConsentementRepository;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConsentementServiceTest {

    private static final String VERSION = "2026-08-10";

    @Mock private ConsentementRepository repo;

    private ConsentementService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new ConsentementService(repo);
        ReflectionTestUtils.setField(service, "versionCourante", VERSION);
    }

    @Test
    @DisplayName("un patient sans trace d'accord doit consentir")
    void consentementRequis_patientSansTrace_true() {
        when(repo.existsByUserIdAndVersion(userId, VERSION)).thenReturn(false);

        assertThat(service.consentementRequis(userId, Role.PATIENT)).isTrue();
    }

    @Test
    @DisplayName("un patient ayant accepté la version courante n'est plus sollicité")
    void consentementRequis_dejaAccepte_false() {
        when(repo.existsByUserIdAndVersion(userId, VERSION)).thenReturn(true);

        assertThat(service.consentementRequis(userId, Role.PATIENT)).isFalse();
    }

    @Test
    @DisplayName("un texte republié en nouvelle version redemande l'accord")
    void consentementRequis_nouvelleVersion_true() {
        when(repo.existsByUserIdAndVersion(userId, VERSION)).thenReturn(true);
        ReflectionTestUtils.setField(service, "versionCourante", "2027-01-01");
        when(repo.existsByUserIdAndVersion(userId, "2027-01-01")).thenReturn(false);

        assertThat(service.consentementRequis(userId, Role.PATIENT)).isTrue();
    }

    @Test
    @DisplayName("le médecin et l'admin ne sont pas les personnes concernées")
    void consentementRequis_autresRoles_false() {
        when(repo.existsByUserIdAndVersion(any(), any())).thenReturn(false);

        assertThat(service.consentementRequis(userId, Role.MEDECIN)).isFalse();
        assertThat(service.consentementRequis(userId, Role.ADMIN)).isFalse();
    }

    @Test
    @DisplayName("l'accord est horodaté avec la version et l'écran d'origine")
    void enregistrer_conserveVersionEtSource() {
        when(repo.existsByUserIdAndVersion(userId, VERSION)).thenReturn(false);
        ArgumentCaptor<ConsentementEntity> saved = ArgumentCaptor.forClass(ConsentementEntity.class);

        service.enregistrer(userId, SourceConsentement.INSCRIPTION);

        verify(repo).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(userId);
        assertThat(saved.getValue().getVersion()).isEqualTo(VERSION);
        assertThat(saved.getValue().getSource()).isEqualTo("INSCRIPTION");
    }

    @Test
    @DisplayName("réaccepter la même version ne crée pas une seconde preuve")
    void enregistrer_dejaAccepte_aucuneEcriture() {
        when(repo.existsByUserIdAndVersion(userId, VERSION)).thenReturn(true);

        service.enregistrer(userId, SourceConsentement.CONNEXION);

        verify(repo, never()).save(any());
    }

    @Test
    @DisplayName("deux envois simultanés ne font pas échouer l'acceptation")
    void enregistrer_courseSurLIndexUnique_neRemontePas() {
        when(repo.existsByUserIdAndVersion(userId, VERSION)).thenReturn(false);
        when(repo.save(any())).thenThrow(new DataIntegrityViolationException("uq_consentement_user_version"));

        assertThatCode(() -> service.enregistrer(userId, SourceConsentement.CONNEXION))
            .doesNotThrowAnyException();
    }
}
