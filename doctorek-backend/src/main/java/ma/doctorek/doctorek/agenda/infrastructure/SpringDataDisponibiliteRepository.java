package ma.doctorek.doctorek.agenda.infrastructure;

import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
class SpringDataDisponibiliteRepository implements DisponibiliteRepository {

    private final JpaDisponibiliteRepository jpa;

    SpringDataDisponibiliteRepository(JpaDisponibiliteRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<Disponibilite> findByMedecinId(UUID medecinId) {
        return jpa.findByMedecinId(medecinId)
                  .stream()
                  .map(DisponibiliteEntity::toDomain)
                  .collect(Collectors.toList());
    }

    @Override
    public Optional<Disponibilite> findByMedecinIdAndJour(UUID medecinId, DayOfWeek jour) {
        return jpa.findByMedecinIdAndJourSemaine(medecinId, jour.name())
                  .map(DisponibiliteEntity::toDomain);
    }

    @Override
    public Disponibilite save(Disponibilite dispo) {
        DisponibiliteEntity entity = DisponibiliteEntity.fromDomain(dispo);
        return jpa.save(entity).toDomain();
    }

    @Override
    @Transactional
    public void deleteByMedecinIdAndJour(UUID medecinId, DayOfWeek jour) {
        jpa.deleteByMedecinIdAndJourSemaine(medecinId, jour.name());
    }
}