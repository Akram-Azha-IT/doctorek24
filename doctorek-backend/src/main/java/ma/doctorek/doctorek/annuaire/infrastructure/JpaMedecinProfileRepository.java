package ma.doctorek.doctorek.annuaire.infrastructure;

import ma.doctorek.doctorek.annuaire.application.dto.PagedMedecinsResponse;
import ma.doctorek.doctorek.annuaire.application.dto.UpdateMedecinProfileRequest;
import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.annuaire.domain.MedecinNearbyResult;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import ma.doctorek.doctorek.auth.domain.User;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

@Repository
public class JpaMedecinProfileRepository implements MedecinProfileRepository {

    private final SpringDataMedecinDetailRepository springData;
    private final UserRepository userRepository;

    public JpaMedecinProfileRepository(SpringDataMedecinDetailRepository springData,
                                        UserRepository userRepository) {
        this.springData     = springData;
        this.userRepository = userRepository;
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
    public PagedMedecinsResponse searchMedecinsPaged(String specialite, String ville, String disponibilite, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size);
        Page<MedecinDetailEntity> result;

        if ("today".equals(disponibilite)) {
            List<String> days = List.of(LocalDate.now().getDayOfWeek().name());
            result = springData.searchActiveMedecinsWithDispoPaged(specialite, ville, days, pageable);
        } else if ("week".equals(disponibilite)) {
            List<String> days = IntStream.range(0, 7)
                .mapToObj(i -> LocalDate.now().plusDays(i).getDayOfWeek().name())
                .distinct()
                .toList();
            result = springData.searchActiveMedecinsWithDispoPaged(specialite, ville, days, pageable);
        } else {
            result = springData.searchActiveMedecinsPaged(specialite, ville, pageable);
        }

        return new PagedMedecinsResponse(
            result.getContent().stream().map(this::toProfile).toList(),
            result.getTotalElements(),
            result.getTotalPages(),
            page,
            size
        );
    }

    @Override
    @Transactional
    public MedecinProfile updateProfile(UUID id, UpdateMedecinProfileRequest req) {
        MedecinDetailEntity md = springData.findById(id)
            .orElseThrow(() -> new MedecinNotFoundException(id));

        User user = userRepository.findById(id)
            .orElseThrow(() -> new MedecinNotFoundException(id));

        user.updateProfile(req.firstName(), req.lastName(), req.phone(), req.lang());
        userRepository.save(user);

        md.updateProfile(req.specialite(), req.ville(), req.adresse(), req.latitude(), req.longitude());
        return toProfile(springData.save(md));
    }

    @Override
    public List<MedecinNearbyResult> findNearbyMedecins(double lat, double lng, double radiusKm, String specialite) {
        String spec = (specialite == null || specialite.isBlank()) ? null : specialite.toLowerCase();
        return springData.findActiveMedecinsWithCoords(spec)
            .stream()
            .map(md -> new MedecinNearbyResult(
                toProfile(md),
                haversine(lat, lng, md.getLatitude(), md.getLongitude())))
            .filter(r -> r.distanceKm() <= radiusKm)
            .sorted(Comparator.comparingDouble(MedecinNearbyResult::distanceKm))
            .toList();
    }

    @Override
    @Transactional
    public MedecinProfile updatePhotoUrl(UUID id, String photoUrl) {
        MedecinDetailEntity md = springData.findById(id)
            .orElseThrow(() -> new MedecinNotFoundException(id));
        md.setPhotoUrl(photoUrl);
        return toProfile(springData.save(md));
    }

    private MedecinProfile toProfile(MedecinDetailEntity md) {
        User u = md.getUser();
        return new MedecinProfile(
            u.getId(),
            u.getFirstName(),
            u.getLastName(),
            md.getSpecialite(),
            md.getVille(),
            md.getAdresse(),
            md.getInpe(),
            md.getLatitude(),
            md.getLongitude(),
            md.getPhotoUrl()
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
