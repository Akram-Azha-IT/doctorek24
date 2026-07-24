package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.CartePublicResponse;
import ma.doctorek.doctorek.dto.CarteSensibleResponse;
import ma.doctorek.doctorek.entity.CarteVirtuelleEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.CarteNotFoundException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.AuditLogRepository;
import ma.doctorek.doctorek.repository.CarteVirtuelleRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CarteServiceTest {

    @Mock CarteVirtuelleRepository carteRepository;
    @Mock AuditLogRepository auditRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationService notifService;

    CarteService service;

    final UUID patientId = UUID.randomUUID();
    final String cardRef = "VMC-2026-ABCD1234";

    @BeforeEach
    void setUp() {
        service = new CarteService(carteRepository, auditRepository, userRepository, notifService);
    }

    private CarteVirtuelleEntity carte() {
        CarteVirtuelleEntity e = new CarteVirtuelleEntity();
        e.setId(UUID.randomUUID());
        e.setPatientId(patientId);
        e.setCardRef(cardRef);
        e.setStatut("VIRTUEL");
        e.setGroupeSanguin("O+");
        e.setAllergies("[\"Pénicilline\"]");
        e.setMaladiesChroniques("[\"Asthme\"]");
        e.setContactsUrgence("[]");
        e.setMedicamentsActuels("[{\"nom\":\"Ventoline\",\"dosage\":\"100µg\"}]");
        e.setAntecedentsChirurgicaux("[]");
        e.setVaccinations("[\"Tétanos\"]");
        e.setAntecedentsFamiliaux("[]");
        e.setAssuranceNom("CNSS");
        e.setAssuranceNumero("123456");
        return e;
    }

    @Test
    @DisplayName("getPublicByCardRef : expose le vital, jamais medicaments/assurance")
    void getPublic_exposesOnlyVital() {
        when(carteRepository.findByCardRef(cardRef)).thenReturn(Optional.of(carte()));
        when(userRepository.findById(patientId)).thenReturn(Optional.of(
                User.builder().firstName("Amine").lastName("Alaoui").email("a@x.ma").build()));

        CartePublicResponse res = service.getPublicByCardRef(cardRef);

        assertThat(res.groupeSanguin()).isEqualTo("O+");
        assertThat(res.allergies()).containsExactly("Pénicilline");
        assertThat(res.maladiesChroniques()).containsExactly("Asthme");
        assertThat(res.firstName()).isEqualTo("Amine");
        // Le record public ne porte tout simplement aucun champ sensible (garanti à la compilation).
    }

    @Test
    @DisplayName("getSensibleByCardRef : renvoie medicaments, antecedents, assurance")
    void getSensible_returnsSensitiveFields() {
        when(carteRepository.findByCardRef(cardRef)).thenReturn(Optional.of(carte()));

        CarteSensibleResponse res = service.getSensibleByCardRef(cardRef);

        assertThat(res.medicamentsActuels()).hasSize(1);
        assertThat(res.medicamentsActuels().get(0).nom()).isEqualTo("Ventoline");
        assertThat(res.vaccinations()).containsExactly("Tétanos");
        assertThat(res.assuranceNom()).isEqualTo("CNSS");
    }

    @Test
    @DisplayName("getOtpTargetByCardRef : résout l'email du patient propriétaire")
    void getOtpTarget_resolvesPatientEmail() {
        when(carteRepository.findByCardRef(cardRef)).thenReturn(Optional.of(carte()));
        when(userRepository.findById(patientId)).thenReturn(Optional.of(
                User.builder().firstName("Amine").lastName("Alaoui").email("amine@x.ma").build()));

        var target = service.getOtpTargetByCardRef(cardRef);

        assertThat(target.email()).isEqualTo("amine@x.ma");
        assertThat(target.firstName()).isEqualTo("Amine");
        assertThat(target.patientId()).isEqualTo(patientId);
    }

    @Test
    @DisplayName("cardRef inconnu : CarteNotFoundException")
    void unknownCardRef_throws() {
        when(carteRepository.findByCardRef("nope")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getPublicByCardRef("nope"))
                .isInstanceOf(CarteNotFoundException.class);
    }
}
