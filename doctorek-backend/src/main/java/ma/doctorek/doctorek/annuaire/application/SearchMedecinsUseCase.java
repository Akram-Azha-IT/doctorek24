package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SearchMedecinsUseCase {

    private final MedecinProfileRepository repo;

    public SearchMedecinsUseCase(MedecinProfileRepository repo) {
        this.repo = repo;
    }

    public List<MedecinProfile> execute(String specialite, String ville) {
        return repo.searchMedecins(specialite, ville);
    }
}
