package ma.doctorek.doctorek.agenda.infrastructure;

import ma.doctorek.doctorek.agenda.domain.PatientSummary;
import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Repository
class SpringDataRendezVousRepository implements RendezVousRepository {

    private final JpaRendezVousRepository jpa;

    SpringDataRendezVousRepository(JpaRendezVousRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public long countAll() {
        return jpa.count();
    }

    @Override
    public long countByDateRdv(LocalDate date) {
        return jpa.countByDateRdv(date);
    }

    @Override
    public long countByStatut(StatutRdv statut) {
        return jpa.countByStatut(statut.name());
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
                  .toList();
    }

    @Override
    public List<RendezVous> findByPatientId(UUID patientId, int page, int size) {
        return jpa.findByPatientId(patientId,
                    PageRequest.of(page, size, Sort.by("dateRdv").descending()))
                  .map(RendezVousEntity::toDomain)
                  .getContent();
    }

    @Override
    public List<RendezVous> findByMedecinId(UUID medecinId, int page, int size) {
        return jpa.findByMedecinId(medecinId,
                    PageRequest.of(page, size, Sort.by("dateRdv").descending()))
                  .map(RendezVousEntity::toDomain)
                  .getContent();
    }

    @Override
    public Stream<RendezVous> streamByDateAndStatutNot(LocalDate date, StatutRdv excludedStatut) {
        return jpa.streamByDateRdvAndStatutNot(date, excludedStatut.name())
                  .map(RendezVousEntity::toDomain);
    }

    @Override
    public boolean existsByMedecinIdAndDateAndHeure(UUID medecinId, LocalDate date, LocalTime heure) {
        return jpa.existsByMedecinIdAndDateRdvAndHeureRdv(medecinId, date, heure);
    }

    @Override
    public List<PatientSummary> findPatientsByMedecinId(UUID medecinId, String search, String filtre, int page, int size) {
        return jpa.findPatientsByMedecinId(medecinId, search, filtre, size, page * size)
                  .stream()
                  .map(p -> new PatientSummary(
                      UUID.fromString(p.getPatientId()),
                      p.getFirstName(),
                      p.getLastName(),
                      p.getDernierRdvDate(),
                      StatutRdv.valueOf(p.getDernierRdvStatut()),
                      p.isHasFutureRdv()
                  ))
                  .toList();
    }

    @Override
    public long countPatientsByMedecinId(UUID medecinId, String search, String filtre) {
        return jpa.countPatientsByMedecinId(medecinId, search, filtre);
    }

    @Override
    public RendezVous save(RendezVous rdv) {
        return jpa.save(RendezVousEntity.fromDomain(rdv)).toDomain();
    }
}