package ma.doctorek.doctorek.agenda.domain;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DisponibiliteRepository {
    List<Disponibilite> findByMedecinId(UUID medecinId);
    Optional<Disponibilite> findByMedecinIdAndJour(UUID medecinId, DayOfWeek jour);
    Disponibilite save(Disponibilite dispo);
    void deleteByMedecinIdAndJour(UUID medecinId, DayOfWeek jour);
}
