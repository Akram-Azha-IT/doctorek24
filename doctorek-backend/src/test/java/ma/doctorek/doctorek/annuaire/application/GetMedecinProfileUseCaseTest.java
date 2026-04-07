package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetMedecinProfileUseCaseTest {

    @Mock
    private MedecinProfileRepository repo;

    @InjectMocks
    private GetMedecinProfileUseCase useCase;

    private final UUID id = UUID.randomUUID();

    @Test
    @DisplayName("returns profile when medecin exists")
    void execute_existingMedecin_returnsProfile() {
        MedecinProfile profile = new MedecinProfile(
            id, "Youssef", "Bakkali", "Cardiologie", "Casablanca", "123 Rue Hassan II", "1234567890"
        );
        when(repo.findMedecinById(id)).thenReturn(Optional.of(profile));

        MedecinProfile result = useCase.execute(id);

        assertThat(result.firstName()).isEqualTo("Youssef");
        assertThat(result.lastName()).isEqualTo("Bakkali");
        assertThat(result.specialite()).isEqualTo("Cardiologie");
        assertThat(result.ville()).isEqualTo("Casablanca");
        assertThat(result.inpe()).isEqualTo("1234567890");
        verify(repo).findMedecinById(id);
    }

    @Test
    @DisplayName("throws MedecinNotFoundException when id not found")
    void execute_unknownId_throwsMedecinNotFoundException() {
        when(repo.findMedecinById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(id))
            .isInstanceOf(MedecinNotFoundException.class)
            .hasMessageContaining(id.toString());
    }

    @Test
    @DisplayName("delegates to repository with correct id")
    void execute_callsRepositoryWithGivenId() {
        when(repo.findMedecinById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(id));

        verify(repo).findMedecinById(id);
    }
}
