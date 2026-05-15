package ma.doctorek.doctorek.annuaire.infrastructure;

import ma.doctorek.doctorek.auth.domain.MedecinProfileCreatePort;
import ma.doctorek.doctorek.auth.domain.User;
import org.springframework.stereotype.Component;

@Component
public class JpaMedecinCreateAdapter implements MedecinProfileCreatePort {

    private final SpringDataMedecinDetailRepository springData;

    public JpaMedecinCreateAdapter(SpringDataMedecinDetailRepository springData) {
        this.springData = springData;
    }

    @Override
    public void create(User user, String inpe, String specialite, String ville, String adresse) {
        springData.save(new MedecinDetailEntity(user, inpe, specialite, ville, adresse));
    }

    @Override
    public boolean existsByInpe(String inpe) {
        return springData.existsByInpe(inpe);
    }
}
