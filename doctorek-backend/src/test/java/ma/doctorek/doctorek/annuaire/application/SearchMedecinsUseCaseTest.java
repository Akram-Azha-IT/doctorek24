package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.application.dto.PagedMedecinsResponse;
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
    void execute_withSpecialiteAndVille_returnsPaged() {
        MedecinProfile profile = new MedecinProfile(
            UUID.randomUUID(), "Hassan", "Alaoui", "Cardiologie", "Casablanca", "Rue 10", "1234567890", null, null, null
        );
        PagedMedecinsResponse paged = new PagedMedecinsResponse(List.of(profile), 1L, 1, 1, 10);
        when(repo.searchMedecinsPaged("Cardiologie", "Casablanca", "all", 1, 10)).thenReturn(paged);

        PagedMedecinsResponse result = useCase.execute("Cardiologie", "Casablanca", "all", 1, 10);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).specialite()).isEqualTo("Cardiologie");
        assertThat(result.content().get(0).ville()).isEqualTo("Casablanca");
        assertThat(result.totalElements()).isEqualTo(1L);
    }

    @Test
    @DisplayName("returns empty content when no medecin matches")
    void execute_noMatch_returnsEmptyContent() {
        PagedMedecinsResponse empty = new PagedMedecinsResponse(List.of(), 0L, 0, 1, 10);
        when(repo.searchMedecinsPaged("Neurologie", "Rabat", "all", 1, 10)).thenReturn(empty);

        PagedMedecinsResponse result = useCase.execute("Neurologie", "Rabat", "all", 1, 10);

        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isZero();
    }

    @Test
    @DisplayName("delegates to repository with null params when not provided")
    void execute_nullParams_delegatesToRepository() {
        PagedMedecinsResponse empty = new PagedMedecinsResponse(List.of(), 0L, 0, 1, 10);
        when(repo.searchMedecinsPaged(null, null, "all", 1, 10)).thenReturn(empty);

        useCase.execute(null, null, "all", 1, 10);

        verify(repo).searchMedecinsPaged(null, null, "all", 1, 10);
    }

    @Test
    @DisplayName("returns all active medecins when both params are null")
    void execute_nullParams_returnsAllMedecins() {
        List<MedecinProfile> all = List.of(
            new MedecinProfile(UUID.randomUUID(), "A", "B", "Cardio", "Rabat", "Rue 1", "0000000001", null, null, null),
            new MedecinProfile(UUID.randomUUID(), "C", "D", "Dermato", "Fes", "Rue 2", "0000000002", null, null, null)
        );
        PagedMedecinsResponse paged = new PagedMedecinsResponse(all, 2L, 1, 1, 10);
        when(repo.searchMedecinsPaged(null, null, "all", 1, 10)).thenReturn(paged);

        PagedMedecinsResponse result = useCase.execute(null, null, "all", 1, 10);

        assertThat(result.content()).hasSize(2);
        assertThat(result.totalElements()).isEqualTo(2L);
    }

    @Test
    @DisplayName("filters by disponibilite=today delegates correct params")
    void execute_todayFilter_delegates() {
        PagedMedecinsResponse paged = new PagedMedecinsResponse(List.of(), 0L, 0, 1, 10);
        when(repo.searchMedecinsPaged("Cardio", "Casa", "today", 1, 10)).thenReturn(paged);

        useCase.execute("Cardio", "Casa", "today", 1, 10);

        verify(repo).searchMedecinsPaged("Cardio", "Casa", "today", 1, 10);
    }
}
