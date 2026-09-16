package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.dto.CarteVirtuelleRequest;
import ma.doctorek.doctorek.dto.PatientDetailRequest;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.AccesPatientRefuseException;
import ma.doctorek.doctorek.repository.PatientDetailRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.AccesPatientService;
import ma.doctorek.doctorek.service.CarteAccessService;
import ma.doctorek.doctorek.service.CarteService;
import ma.doctorek.doctorek.service.GoogleWalletService;
import ma.doctorek.doctorek.service.PatientDetailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientResourceAccessControllerTest {

    @Mock PatientDetailService patientDetailService;
    @Mock CarteService carteService;
    @Mock CarteAccessService carteAccessService;
    @Mock UserRepository userRepository;
    @Mock PatientDetailRepository patientDetailRepository;
    @Mock GoogleWalletService googleWalletService;
    @Mock AccesPatientService accesPatientService;
    @Mock RendezVousRepository rendezVousRepository;
    private PatientDetailController patientController;
    private CarteController carteController;
    private final UUID requesterId = UUID.randomUUID();
    private final UUID otherPatientId = UUID.randomUUID();
    private Authentication auth;

    @BeforeEach
    void setUp() {
        patientController = new PatientDetailController(patientDetailService, accesPatientService, rendezVousRepository, userRepository);
        carteController = new CarteController(carteService, carteAccessService, userRepository, patientDetailRepository,
                googleWalletService, accesPatientService, rendezVousRepository);
        auth = new TestingAuthenticationToken("patient@example.test", null, "ROLE_PATIENT");
        when(userRepository.findByEmail("patient@example.test")).thenReturn(Optional.of(User.builder()
                .id(requesterId).email("patient@example.test").password("unused").firstName("Test").lastName("Patient").build()));
        doThrow(new AccesPatientRefuseException(otherPatientId)).when(accesPatientService)
                .verifierAcces(requesterId, otherPatientId);
    }

    @Test
    void profileWriteCannotTargetAnUnrelatedPatient() {
        assertThatThrownBy(() -> patientController.upsert(auth, otherPatientId, mock(PatientDetailRequest.class)))
                .isInstanceOf(AccesPatientRefuseException.class);
        verifyNoInteractions(patientDetailService);
    }

    @Test
    void cardWriteCannotTargetAnUnrelatedPatient() {
        assertThatThrownBy(() -> carteController.update(otherPatientId, auth, mock(CarteVirtuelleRequest.class)))
                .isInstanceOf(AccesPatientRefuseException.class);
        verifyNoInteractions(carteService);
    }
}
