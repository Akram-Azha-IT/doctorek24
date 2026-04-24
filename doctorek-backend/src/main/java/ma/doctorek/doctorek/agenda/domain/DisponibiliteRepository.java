package ma.doctorek.doctorek.agenda.domain;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DisponibiliteRepository {
    List<Disponibilite> findByMedecinId(UUID medecinId);
    Optional<Disponibilite> findByMedecinIdAndJour(UUID medecinId, DayOfWeek jour);
    List<Disponibilite> findAllByMedecinIdAndJour(UUID medecinId, DayOfWeek jour);
    Optional<Disponibilite> findById(UUID id);
    Disponibilite save(Disponibilite dispo);
    void deleteById(UUID id);
    void deleteByMedecinIdAndJour(UUID medecinId, DayOfWeek jour);
}
