package ma.doctorek.doctorek.annuaire.infrastructure;

import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;
import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.annuaire.domain.MedecinNearbyResult;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.domain.User;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
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
                           req.specialite(), req.ville(), req.adresse(), req.lang(),
                           req.latitude(), req.longitude());
        return toProfile(springData.save(user));
    }

    @Override
    public List<MedecinNearbyResult> findNearbyMedecins(double lat, double lng, double radiusKm, String specialite) {
        String spec = (specialite == null || specialite.isBlank()) ? null : specialite.toLowerCase();
        return springData.findActiveMedecinsWithCoords(spec)
            .stream()
            .map(u -> new MedecinNearbyResult(toProfile(u), haversine(lat, lng, u.getLatitude(), u.getLongitude())))
            .filter(r -> r.distanceKm() <= radiusKm)
            .sorted(Comparator.comparingDouble(MedecinNearbyResult::distanceKm))
            .toList();
    }

    private MedecinProfile toProfile(User u) {
        return new MedecinProfile(
            u.getId(),
            u.getFirstName(),
            u.getLastName(),
            u.getSpecialite(),
            u.getVille(),
            u.getAdresse(),
            u.getInpe(),
            u.getLatitude(),
            u.getLongitude()
        );
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
