package ma.doctorek.doctorek.annuaire.application;

import ma.doctorek.doctorek.annuaire.domain.MedecinNearbyResult;
import ma.doctorek.doctorek.annuaire.domain.MedecinProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SearchNearbyMedecinsUseCase {

    private static final double MAX_RADIUS_KM = 100.0;

    private final MedecinProfileRepository repo;

    public SearchNearbyMedecinsUseCase(MedecinProfileRepository repo) {
        this.repo = repo;
    }

    public List<MedecinNearbyResult> execute(double lat, double lng, double radiusKm, String specialite) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
            throw new IllegalArgumentException("Coordonnées invalides");
        if (radiusKm <= 0 || radiusKm > MAX_RADIUS_KM)
            throw new IllegalArgumentException("Le rayon doit être compris entre 0 et 100 km");
        return repo.findNearbyMedecins(lat, lng, radiusKm, specialite);
    }
}
