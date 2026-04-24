package ma.doctorek.doctorek.agenda.domain;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

public interface RendezVousRepository {
    Optional<RendezVous> findById(UUID id);
    List<PatientSummary> findPatientsByMedecinId(UUID medecinId, String search, String filtre, int page, int size);
    long countPatientsByMedecinId(UUID medecinId, String search, String filtre);
    List<RendezVous> findByMedecinIdAndDate(UUID medecinId, LocalDate date);
    List<RendezVous> findByPatientId(UUID patientId, int page, int size);
    List<RendezVous> findByMedecinId(UUID medecinId, int page, int size);
    Stream<RendezVous> streamByDateAndStatutNot(LocalDate date, StatutRdv excludedStatut);
    boolean existsByMedecinIdAndDateAndHeure(UUID medecinId, LocalDate date, LocalTime heure);
    RendezVous save(RendezVous rdv);
}
