package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.repository.MedecinDetailRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnuaireServiceDisponibiliteTest {

    @Mock MedecinDetailRepository medecinRepository;
    @Mock UserRepository userRepository;

    @Test
    void rechercheParDateFiltreLeJourEtLaPeriodeSelectionnes() {
        AnnuaireService service = new AnnuaireService(medecinRepository, userRepository);
        LocalDate date = LocalDate.of(2026, 8, 21);
        PageRequest page = PageRequest.of(0, 10);

        when(medecinRepository.searchActiveMedecinsWithDispoPaged(
                "Cardiologie", "Casablanca", null, List.of("FRIDAY"), date, date, page))
            .thenReturn(Page.empty(page));

        service.searchMedecins("Cardiologie", "Casablanca", null, "all", date, 1, 10);

        verify(medecinRepository).searchActiveMedecinsWithDispoPaged(
            "Cardiologie", "Casablanca", null, List.of("FRIDAY"), date, date, page);
    }
}
