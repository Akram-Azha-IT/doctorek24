package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.application.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import org.springframework.stereotype.Service;

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

        // Upsert : supprimer l'entrée existante si elle existe, puis recréer
        dispoRepo.deleteByMedecinIdAndJour(medecinId, req.jourSemaine());

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
