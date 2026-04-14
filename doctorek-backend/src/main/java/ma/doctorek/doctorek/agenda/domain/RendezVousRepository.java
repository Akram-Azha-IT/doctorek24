package ma.doctorek.doctorek.agenda.domain;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RendezVousRepository {
    Optional<RendezVous> findById(UUID id);
    List<RendezVous> findByMedecinIdAndDate(UUID medecinId, LocalDate date);
    List<RendezVous> findByPatientId(UUID patientId);
    boolean existsByMedecinIdAndDateAndHeure(UUID medecinId, LocalDate date, LocalTime heure);
    RendezVous save(RendezVous rdv);
}