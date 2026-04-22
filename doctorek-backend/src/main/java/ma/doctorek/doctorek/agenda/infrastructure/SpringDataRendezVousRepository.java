package ma.doctorek.doctorek.agenda.infrastructure;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
class SpringDataRendezVousRepository implements RendezVousRepository {

    private final JpaRendezVousRepository jpa;

    SpringDataRendezVousRepository(JpaRendezVousRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Optional<RendezVous> findById(UUID id) {
        return jpa.findById(id).map(RendezVousEntity::toDomain);
    }

    @Override
    public List<RendezVous> findByMedecinIdAndDate(UUID medecinId, LocalDate date) {
        return jpa.findByMedecinIdAndDateRdv(medecinId, date)
                  .stream()
                  .map(RendezVousEntity::toDomain)
                  .collect(Collectors.toList());
    }

    @Override
    public List<RendezVous> findByPatientId(UUID patientId) {
        return jpa.findByPatientId(patientId)
                  .stream()
                  .map(RendezVousEntity::toDomain)
                  .collect(Collectors.toList());
    }

    @Override
    public List<RendezVous> findByMedecinId(UUID medecinId) {
        return jpa.findByMedecinId(medecinId)
                  .stream()
                  .map(RendezVousEntity::toDomain)
                  .collect(Collectors.toList());
    }

    @Override
    public List<RendezVous> findByDateAndStatutNot(LocalDate date, StatutRdv excludedStatut) {
        return jpa.findByDateRdvAndStatutNot(date, excludedStatut.name())
                  .stream()
                  .map(RendezVousEntity::toDomain)
                  .collect(Collectors.toList());
    }

    @Override
    public boolean existsByMedecinIdAndDateAndHeure(UUID medecinId, LocalDate date, LocalTime heure) {
        return jpa.existsByMedecinIdAndDateRdvAndHeureRdv(medecinId, date, heure);
    }

    @Override
    public RendezVous save(RendezVous rdv) {
        return jpa.save(RendezVousEntity.fromDomain(rdv)).toDomain();
    }
}