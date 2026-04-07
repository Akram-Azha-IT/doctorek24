package ma.doctorek.doctorek.annuaire.infrastructure;

import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import ma.doctorek.doctorek.auth.domain.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaMedecinProfileRepository implements MedecinProfileRepository {

    private final SpringDataMedecinRepository springData;

    public JpaMedecinProfileRepository(SpringDataMedecinRepository springData) {
        this.springData = springData;
    }

    @Override
    public Optional<MedecinProfile> findMedecinById(UUID id) {
        return springData.findActiveMedecinById(id).map(this::toProfile);
    }

    private MedecinProfile toProfile(User u) {
        return new MedecinProfile(
            u.getId(),
            u.getFirstName(),
            u.getLastName(),
            u.getSpecialite(),
            u.getVille(),
            u.getAdresse(),
            u.getInpe()
        );
    }
}
