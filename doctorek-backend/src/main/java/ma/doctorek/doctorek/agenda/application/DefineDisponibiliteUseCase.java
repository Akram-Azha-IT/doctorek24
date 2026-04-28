package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.application.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import ma.doctorek.doctorek.agenda.domain.FrequenceDisponibilite;
import ma.doctorek.doctorek.agenda.domain.TypeFinRecurrence;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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

        List<Disponibilite> existing = dispoRepo.findAllByMedecinIdAndJour(medecinId, req.jourSemaine());
        for (Disponibilite dispo : existing) {
            boolean exactMatch = req.heureDebut().equals(dispo.heureDebut())
                              && req.heureFin().equals(dispo.heureFin());
            if (exactMatch) {
                return dispo;
            }
            boolean overlaps = req.heureDebut().isBefore(dispo.heureFin())
                            && req.heureFin().isAfter(dispo.heureDebut());
            if (overlaps) {
                dispoRepo.deleteById(dispo.id());
            }
        }

        FrequenceDisponibilite frequence = req.frequence() != null
            ? req.frequence()
            : FrequenceDisponibilite.TOUTES_LES_SEMAINES;

        int intervalSemaines = (req.intervalSemaines() != null && req.intervalSemaines() > 0)
            ? req.intervalSemaines()
            : 1;

        LocalDate dateDebut = req.dateDebut() != null
            ? req.dateDebut()
            : LocalDate.now();

        TypeFinRecurrence typeFinRecurrence = req.typeFinRecurrence() != null
            ? req.typeFinRecurrence()
            : TypeFinRecurrence.JAMAIS;

        Disponibilite dispo = new Disponibilite(
            null,
            medecinId,
            req.jourSemaine(),
            req.heureDebut(),
            req.heureFin(),
            req.dureeConsultation(),
            frequence,
            intervalSemaines,
            dateDebut,
            typeFinRecurrence,
            req.dateFin()
        );
        return dispoRepo.save(dispo);
    }
}
