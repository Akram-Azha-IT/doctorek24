package ma.doctorek.doctorek.annuaire.domain;

import java.util.Optional;
import java.util.UUID;

public interface MedecinProfileRepository {
    Optional<MedecinProfile> findMedecinById(UUID id);
}
