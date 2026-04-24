package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Service
public class ReprogrammerRendezVousUseCase {

    private final RendezVousRepository repo;

    public ReprogrammerRendezVousUseCase(RendezVousRepository repo) {
        this.repo = repo;
    }

    public RendezVous execute(UUID id, LocalDate newDate, LocalTime newHeure) {
        RendezVous rdv = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("RDV non trouvé: " + id));

        boolean slotTaken = repo.findByMedecinIdAndDate(rdv.medecinId(), newDate)
            .stream()
            .anyMatch(r -> r.heureRdv().equals(newHeure) && !r.id().equals(id));

        if (slotTaken) {
            throw new IllegalStateException("Ce créneau est déjà pris");
        }

        return repo.save(rdv.reprogrammer(newDate, newHeure));
    }
}
