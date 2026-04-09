package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;
import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UpdateMedecinProfileUseCaseTest {

    @Mock
    private MedecinProfileRepository repo;

    @InjectMocks
    private UpdateMedecinProfileUseCase useCase;

    @Test
    @DisplayName("returns updated profile when medecin exists")
    void execute_existingMedecin_returnsUpdatedProfile() {
        UUID id = UUID.randomUUID();
        UpdateMedecinProfileRequest request = new UpdateMedecinProfileRequest(
            "Hassan", "Alaoui", "+212600000001",
            "Cardiologie", "Casablanca", "Rue 10", "fr"
        );
        MedecinProfile updated = new MedecinProfile(
            id, "Hassan", "Alaoui", "Cardiologie", "Casablanca", "Rue 10", "1234567890"
        );
        when(repo.updateProfile(id, request)).thenReturn(updated);

        MedecinProfile result = useCase.execute(id, request);

        assertThat(result.firstName()).isEqualTo("Hassan");
        assertThat(result.specialite()).isEqualTo("Cardiologie");
    }

    @Test
    @DisplayName("throws MedecinNotFoundException when medecin does not exist")
    void execute_unknownId_throwsMedecinNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        UpdateMedecinProfileRequest request = new UpdateMedecinProfileRequest(
            "Hassan", "Alaoui", "+212600000001",
            "Cardiologie", "Casablanca", "Rue 10", "fr"
        );
        when(repo.updateProfile(unknownId, request))
            .thenThrow(new MedecinNotFoundException(unknownId));

        assertThatThrownBy(() -> useCase.execute(unknownId, request))
            .isInstanceOf(MedecinNotFoundException.class);
    }
}
