package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchMedecinsUseCaseTest {

    @Mock
    private MedecinProfileRepository repo;

    @InjectMocks
    private SearchMedecinsUseCase useCase;

    @Test
    @DisplayName("returns matching medecins for given specialite and ville")
    void execute_withSpecialiteAndVille_returnsList() {
        MedecinProfile profile = new MedecinProfile(
            UUID.randomUUID(), "Hassan", "Alaoui", "Cardiologie", "Casablanca", "Rue 10", "1234567890"
        );
        when(repo.searchMedecins("Cardiologie", "Casablanca")).thenReturn(List.of(profile));

        List<MedecinProfile> result = useCase.execute("Cardiologie", "Casablanca");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).specialite()).isEqualTo("Cardiologie");
        assertThat(result.get(0).ville()).isEqualTo("Casablanca");
    }

    @Test
    @DisplayName("returns empty list when no medecin matches")
    void execute_noMatch_returnsEmptyList() {
        when(repo.searchMedecins("Neurologie", "Rabat")).thenReturn(List.of());

        List<MedecinProfile> result = useCase.execute("Neurologie", "Rabat");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("delegates to repository with null params when not provided")
    void execute_nullParams_delegatesToRepository() {
        when(repo.searchMedecins(null, null)).thenReturn(List.of());

        useCase.execute(null, null);

        verify(repo).searchMedecins(null, null);
    }

    @Test
    @DisplayName("returns all active medecins when both params are null")
    void execute_nullParams_returnsAllMedecins() {
        List<MedecinProfile> all = List.of(
            new MedecinProfile(UUID.randomUUID(), "A", "B", "Cardio", "Rabat", "Rue 1", "0000000001"),
            new MedecinProfile(UUID.randomUUID(), "C", "D", "Dermato", "Fes", "Rue 2", "0000000002")
        );
        when(repo.searchMedecins(null, null)).thenReturn(all);

        List<MedecinProfile> result = useCase.execute(null, null);

        assertThat(result).hasSize(2);
    }
}
