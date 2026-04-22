package ma.doctorek.doctorek.agenda.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

interface JpaRendezVousRepository extends JpaRepository<RendezVousEntity, UUID> {

    List<RendezVousEntity> findByMedecinIdAndDateRdv(UUID medecinId, LocalDate dateRdv);

    List<RendezVousEntity> findByPatientId(UUID patientId);

    List<RendezVousEntity> findByMedecinId(UUID medecinId);

    List<RendezVousEntity> findByDateRdvAndStatutNot(LocalDate dateRdv, String statut);

    boolean existsByMedecinIdAndDateRdvAndHeureRdv(UUID medecinId, LocalDate dateRdv, LocalTime heureRdv);
}