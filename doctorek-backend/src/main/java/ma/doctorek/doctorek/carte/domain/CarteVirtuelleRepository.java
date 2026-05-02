package ma.doctorek.doctorek.carte.domain;

import java.util.Optional;
import java.util.UUID;

public interface CarteVirtuelleRepository {
    CarteVirtuelle save(CarteVirtuelle carte);
    Optional<CarteVirtuelle> findByPatientId(UUID patientId);
    Optional<CarteVirtuelle> findByCardRef(String cardRef);
    boolean existsByPatientId(UUID patientId);
    void logAudit(UUID cardId, String action, UUID changedBy);
}
