package ma.doctorek.doctorek.agenda.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface JpaDisponibiliteRepository extends JpaRepository<DisponibiliteEntity, UUID> {

    List<DisponibiliteEntity> findByMedecinId(UUID medecinId);

    Optional<DisponibiliteEntity> findByMedecinIdAndJourSemaine(UUID medecinId, String jourSemaine);

    List<DisponibiliteEntity> findAllByMedecinIdAndJourSemaine(UUID medecinId, String jourSemaine);

    void deleteByMedecinIdAndJourSemaine(UUID medecinId, String jourSemaine);
}