package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteNotFoundException;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class DeleteDisponibiliteUseCase {

    private final DisponibiliteRepository dispoRepo;

    public DeleteDisponibiliteUseCase(DisponibiliteRepository dispoRepo) {
        this.dispoRepo = dispoRepo;
    }

    /**
     * Supprime une disponibilité spécifique par son ID.
     * Vérifie que la disponibilité appartient bien au médecin indiqué.
     */
    public void execute(UUID medecinId, UUID disponibiliteId) {
        Disponibilite dispo = dispoRepo.findById(disponibiliteId)
            .orElseThrow(() -> new DisponibiliteNotFoundException(disponibiliteId));

        if (!dispo.medecinId().equals(medecinId)) {
            throw new IllegalArgumentException(
                "Cette disponibilité n'appartient pas au médecin indiqué");
        }

        dispoRepo.deleteById(disponibiliteId);
    }
}
