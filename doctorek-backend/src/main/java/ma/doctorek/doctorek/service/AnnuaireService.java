package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.MedecinProfile;
import ma.doctorek.doctorek.dto.PagedMedecinsResponse;
import ma.doctorek.doctorek.dto.UpdateMedecinPhotoRequest;
import ma.doctorek.doctorek.dto.UpdateMedecinProfileRequest;
import ma.doctorek.doctorek.entity.MedecinDetailEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.MedecinNotFoundException;
import ma.doctorek.doctorek.repository.MedecinDetailRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
@Transactional(readOnly = true)
public class AnnuaireService {

    private static final double MAX_RADIUS_KM = 100.0;

    private final MedecinDetailRepository medecinRepository;
    private final UserRepository userRepository;

    public AnnuaireService(MedecinDetailRepository medecinRepository,
                            UserRepository userRepository) {
        this.medecinRepository = medecinRepository;
        this.userRepository    = userRepository;
    }

    @Cacheable(value = "medecins", key = "#id")
    public MedecinProfile getMedecinProfile(UUID id) {
        return medecinRepository.findActiveMedecinById(id)
            .map(this::toProfile)
            .orElseThrow(() -> new MedecinNotFoundException(id));
    }

    @Cacheable(value = "medecins-search",
        key = "#specialite + ':' + #ville + ':' + #nom + ':' + #disponibilite + ':' + #page + ':' + #size")
    public PagedMedecinsResponse searchMedecins(String specialite, String ville, String nom,
                                                 String disponibilite, int page, int size) {
        return searchMedecins(specialite, ville, nom, disponibilite, null, page, size);
    }

    @Cacheable(value = "medecins-search",
        key = "#specialite + ':' + #ville + ':' + #nom + ':' + #disponibilite + ':' + #date + ':' + #page + ':' + #size")
    public PagedMedecinsResponse searchMedecins(String specialite, String ville, String nom,
                                                 String disponibilite, LocalDate date, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size);
        Page<MedecinDetailEntity> result;

        if (date != null) {
            List<String> days = List.of(date.getDayOfWeek().name());
            result = medecinRepository.searchActiveMedecinsWithDispoPaged(
                specialite, ville, nom, days, date, date, pageable);
        } else if ("today".equals(disponibilite)) {
            LocalDate today = LocalDate.now();
            List<String> days = List.of(today.getDayOfWeek().name());
            result = medecinRepository.searchActiveMedecinsWithDispoPaged(
                specialite, ville, nom, days, today, today, pageable);
        } else if ("week".equals(disponibilite)) {
            LocalDate today = LocalDate.now();
            LocalDate weekEnd = today.plusDays(6);
            List<String> days = IntStream.range(0, 7)
                .mapToObj(i -> today.plusDays(i).getDayOfWeek().name())
                .distinct()
                .toList();
            result = medecinRepository.searchActiveMedecinsWithDispoPaged(
                specialite, ville, nom, days, today, weekEnd, pageable);
        } else {
            result = medecinRepository.searchActiveMedecinsPaged(specialite, ville, nom, pageable);
        }

        return new PagedMedecinsResponse(
            result.getContent().stream().map(this::toProfile).toList(),
            result.getTotalElements(),
            result.getTotalPages(),
            page,
            size
        );
    }

    public record MedecinNearbyResult(MedecinProfile medecin, double distanceKm) {}

    public List<MedecinNearbyResult> searchNearby(double lat, double lng, double radiusKm, String specialite) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
            throw new IllegalArgumentException("Coordonnées invalides");
        if (radiusKm <= 0 || radiusKm > MAX_RADIUS_KM)
            throw new IllegalArgumentException("Le rayon doit être compris entre 0 et 100 km");

        String spec = (specialite == null || specialite.isBlank()) ? null : specialite.toLowerCase();
        return medecinRepository.findActiveMedecinsWithCoords(spec)
            .stream()
            .map(md -> new MedecinNearbyResult(
                toProfile(md),
                haversine(lat, lng, md.getLatitude(), md.getLongitude())))
            .filter(r -> r.distanceKm() <= radiusKm)
            .sorted(Comparator.comparingDouble(MedecinNearbyResult::distanceKm))
            .toList();
    }

    @Transactional
    @CacheEvict(value = "medecins", key = "#id")
    public MedecinProfile updateMedecinProfile(UUID id, UpdateMedecinProfileRequest req) {
        MedecinDetailEntity md = medecinRepository.findById(id)
            .orElseThrow(() -> new MedecinNotFoundException(id));

        User user = userRepository.findById(id)
            .orElseThrow(() -> new MedecinNotFoundException(id));

        user.updateProfile(req.firstName(), req.lastName(), req.phone(), req.lang());
        userRepository.save(user);

        md.updateProfile(req.specialite(), req.ville(), req.adresse(), req.latitude(), req.longitude());
        return toProfile(medecinRepository.save(md));
    }

    @Transactional
    @CacheEvict(value = "medecins", key = "#id")
    public MedecinProfile updateMedecinPhoto(UUID id, UpdateMedecinPhotoRequest req) {
        MedecinDetailEntity md = medecinRepository.findById(id)
            .orElseThrow(() -> new MedecinNotFoundException(id));
        md.setPhotoUrl(req.photoUrl());
        return toProfile(medecinRepository.save(md));
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
