package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.dto.PagedMedecinsResponse;
import ma.doctorek.doctorek.service.AnnuaireService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AnnuaireControllerDisponibiliteTest {

    @Test
    void transmetLaDateExacteAuService() {
        AnnuaireService service = mock(AnnuaireService.class);
        AnnuaireController controller = new AnnuaireController(service);
        LocalDate date = LocalDate.of(2026, 8, 21);
        PagedMedecinsResponse page = new PagedMedecinsResponse(List.of(), 0, 0, 1, 10);

        when(service.searchMedecins("Cardiologie", "Casablanca", null, "all", date, 1, 10))
            .thenReturn(page);

        var response = controller.searchMedecins(
            "Cardiologie", "Casablanca", null, "all", date, 1, 10);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service).searchMedecins(
            "Cardiologie", "Casablanca", null, "all", date, 1, 10);
    }
}
