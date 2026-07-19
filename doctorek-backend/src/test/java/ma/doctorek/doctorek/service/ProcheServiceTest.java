package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.AddProcheRequest;
import ma.doctorek.doctorek.dto.ProcheResponse;
import ma.doctorek.doctorek.dto.UpdateProcheRequest;
import ma.doctorek.doctorek.entity.GestionEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.enums.RoleGestion;
import ma.doctorek.doctorek.exception.ProcheNotFoundException;
import ma.doctorek.doctorek.repository.GestionRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProcheServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private GestionRepository gestionRepository;
    @Mock private PatientPivotService patientPivotService;

    private ProcheService service;

    private final UUID gestionnaireId = UUID.randomUUID();
    private final UUID procheId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new ProcheService(patientRepository, gestionRepository, patientPivotService);
    }

    private AddProcheRequest addRequest(LocalDate dateNaissance, String email) {
        return new AddProcheRequest("Alaoui", "Sami", dateNaissance,
            "Casablanca", email, "0600000000", RoleGestion.PARENT, true);
    }

    @Test
    @DisplayName("addProche crée un patient sans compte + une gestion active")
    void addProche_createsPatientAndGestion() {
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gestionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProcheResponse response = service.addProche(gestionnaireId,
            addRequest(LocalDate.now().minusYears(30), "sami@mail.com"));

        ArgumentCaptor<PatientEntity> patientCaptor = ArgumentCaptor.forClass(PatientEntity.class);
        verify(patientRepository).save(patientCaptor.capture());
        assertThat(patientCaptor.getValue().getCompteId()).isNull();
        assertThat(patientCaptor.getValue().getEmail()).isEqualTo("sami@mail.com");

        ArgumentCaptor<GestionEntity> gestionCaptor = ArgumentCaptor.forClass(GestionEntity.class);
        verify(gestionRepository).save(gestionCaptor.capture());
        assertThat(gestionCaptor.getValue().getGestionnaireCompteId()).isEqualTo(gestionnaireId);
        assertThat(gestionCaptor.getValue().isDeclarationRepresentantLegal()).isTrue();
        assertThat(gestionCaptor.getValue().isActif()).isTrue();

        assertThat(response.self()).isFalse();
        assertThat(response.role()).isEqualTo(RoleGestion.PARENT);
    }

    @Test
    @DisplayName("addProche mineur : email et téléphone ignorés (notifications via gestionnaire)")
    void addProche_minor_stripsContactInfo() {
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gestionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.addProche(gestionnaireId, addRequest(LocalDate.now().minusYears(7), "enfant@mail.com"));

        ArgumentCaptor<PatientEntity> captor = ArgumentCaptor.forClass(PatientEntity.class);
        verify(patientRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isNull();
        assertThat(captor.getValue().getTelephone()).isNull();
        assertThat(captor.getValue().isMineur()).isTrue();
    }

    @Test
    @DisplayName("listProfils retourne le titulaire (self) puis les proches actifs")
    void listProfils_returnsSelfThenProches() {
        PatientEntity self = new PatientEntity("Alaoui", "Nora", null);
        self.setId(gestionnaireId);
        self.setCompteId(gestionnaireId);
        when(patientPivotService.getOrCreateSelf(gestionnaireId)).thenReturn(self);

        GestionEntity gestion = new GestionEntity(gestionnaireId, procheId, RoleGestion.PARENT, true);
        when(gestionRepository.findByGestionnaireCompteIdAndActifTrue(gestionnaireId))
            .thenReturn(List.of(gestion));
        PatientEntity proche = new PatientEntity("Alaoui", "Sami", LocalDate.now().minusYears(7));
        proche.setId(procheId);
        when(patientRepository.findById(procheId)).thenReturn(Optional.of(proche));

        List<ProcheResponse> profils = service.listProfils(gestionnaireId);

        assertThat(profils).hasSize(2);
        assertThat(profils.get(0).self()).isTrue();
        assertThat(profils.get(1).self()).isFalse();
        assertThat(profils.get(1).mineur()).isTrue();
    }

    @Test
    @DisplayName("removeProche désactive la gestion (soft delete, dossier conservé)")
    void removeProche_softDeletesGestion() {
        GestionEntity gestion = new GestionEntity(gestionnaireId, procheId, RoleGestion.PARENT, true);
        when(gestionRepository.findByGestionnaireCompteIdAndPatientIdAndActifTrue(gestionnaireId, procheId))
            .thenReturn(Optional.of(gestion));
        when(gestionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.removeProche(gestionnaireId, procheId);

        assertThat(gestion.isActif()).isFalse();
    }

    @Test
    @DisplayName("updateProche d'un proche non géré : 404")
    void updateProche_notManaged_throws() {
        when(gestionRepository.findByGestionnaireCompteIdAndPatientIdAndActifTrue(gestionnaireId, procheId))
            .thenReturn(Optional.empty());

        UpdateProcheRequest request = new UpdateProcheRequest("Alaoui", "Sami",
            LocalDate.now().minusYears(30), null, null, null, RoleGestion.AIDANT);

        assertThatThrownBy(() -> service.updateProche(gestionnaireId, procheId, request))
            .isInstanceOf(ProcheNotFoundException.class);
    }
}
