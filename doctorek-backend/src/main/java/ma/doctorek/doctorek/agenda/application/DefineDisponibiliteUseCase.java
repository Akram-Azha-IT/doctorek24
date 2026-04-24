package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.application.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class DefineDisponibiliteUseCase {

    private final DisponibiliteRepository dispoRepo;

    public DefineDisponibiliteUseCase(DisponibiliteRepository dispoRepo) {
        this.dispoRepo = dispoRepo;
    }

    public Disponibilite execute(UUID medecinId, DefineDisponibiliteRequest req) {
        if (!req.heureDebut().isBefore(req.heureFin())) {
            throw new IllegalArgumentException(
                "L'heure de début doit être antérieure à l'heure de fin");
        }

        // Vérifier les chevauchements avec les blocs existants pour le même jour
        List<Disponibilite> existing = dispoRepo.findAllByMedecinIdAndJour(medecinId, req.jourSemaine());
        for (Disponibilite dispo : existing) {
            boolean overlaps = req.heureDebut().isBefore(dispo.heureFin())
                            && req.heureFin().isAfter(dispo.heureDebut());
            if (overlaps) {
                throw new IllegalArgumentException(
                    "Ce créneau chevauche une disponibilité existante ("
                    + dispo.heureDebut() + " – " + dispo.heureFin() + ")");
            }
        }

        Disponibilite dispo = new Disponibilite(
            null,
            medecinId,
            req.jourSemaine(),
            req.heureDebut(),
            req.heureFin(),
            req.dureeConsultation()
        );
        return dispoRepo.save(dispo);
    }
}

