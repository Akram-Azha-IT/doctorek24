package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.exception.AccesPatientRefuseException;
import ma.doctorek.doctorek.exception.PatientNotFoundException;
import ma.doctorek.doctorek.repository.GestionRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccesPatientServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private GestionRepository gestionRepository;
    @Mock private PatientPivotService patientPivotService;

    private AccesPatientService service;

    private final UUID requesterId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new AccesPatientService(patientRepository, gestionRepository, patientPivotService);
    }

    private PatientEntity patient(UUID compteId) {
        PatientEntity p = new PatientEntity("Alaoui", "Nora", null);
        p.setCompteId(compteId);
        return p;
    }

    @Test
    @DisplayName("soi-même : accès autorisé et pivot créé au besoin")
    void peutGererPatient_self_allowsAndEnsuresPivot() {
        assertThat(service.peutGererPatient(requesterId, requesterId)).isTrue();
        verify(patientPivotService).getOrCreateSelf(requesterId);
    }

    @Test
    @DisplayName("patient dont le compte est le requester : autorisé")
    void peutGererPatient_ownAccount_allows() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient(requesterId)));

        assertThat(service.peutGererPatient(requesterId, patientId)).isTrue();
    }

    @Test
    @DisplayName("gestion active : autorisé")
    void peutGererPatient_activeGestion_allows() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient(null)));
        when(gestionRepository.existsByGestionnaireCompteIdAndPatientIdAndActifTrue(requesterId, patientId))
            .thenReturn(true);

        assertThat(service.peutGererPatient(requesterId, patientId)).isTrue();
    }

    @Test
    @DisplayName("aucun lien : refusé avec 403")
    void verifierAcces_unrelated_throws() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient(UUID.randomUUID())));
        when(gestionRepository.existsByGestionnaireCompteIdAndPatientIdAndActifTrue(requesterId, patientId))
            .thenReturn(false);

        assertThatThrownBy(() -> service.verifierAcces(requesterId, patientId))
            .isInstanceOf(AccesPatientRefuseException.class);
    }

    @Test
    @DisplayName("patient inexistant : 404")
    void peutGererPatient_missingPatient_throws() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.peutGererPatient(requesterId, patientId))
            .isInstanceOf(PatientNotFoundException.class);
    }
}
