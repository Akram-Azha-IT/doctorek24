package ma.doctorek.doctorek.annuaire.infrastructure;

import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;
import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.domain.User;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    @Override
    public List<MedecinProfile> searchMedecins(String specialite, String ville) {
        return springData.searchActiveMedecins(specialite, ville)
            .stream()
            .map(this::toProfile)
            .toList();
    }

    @Override
    public MedecinProfile updateProfile(UUID id, UpdateMedecinProfileRequest req) {
        User user = springData.findById(id)
            .filter(u -> u.getRole() == Role.MEDECIN)
            .orElseThrow(() -> new MedecinNotFoundException(id));
        user.updateProfile(req.firstName(), req.lastName(), req.phone(),
                           req.specialite(), req.ville(), req.adresse(), req.lang());
        return toProfile(springData.save(user));
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
