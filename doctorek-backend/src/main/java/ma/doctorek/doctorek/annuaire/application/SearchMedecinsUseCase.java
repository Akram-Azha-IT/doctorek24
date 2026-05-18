package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.application.dto.PagedMedecinsResponse;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SearchMedecinsUseCase {

    private final MedecinProfileRepository repo;

    public SearchMedecinsUseCase(MedecinProfileRepository repo) {
        this.repo = repo;
    }

    public PagedMedecinsResponse execute(String specialite, String ville, String disponibilite, int page, int size) {
        return repo.searchMedecinsPaged(specialite, ville, disponibilite, page, size);
    }
}
