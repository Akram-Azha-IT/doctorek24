package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.Creneau;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GetCreneauxDisponiblesUseCase {

    private final DisponibiliteRepository dispoRepo;
    private final RendezVousRepository rdvRepo;

    public GetCreneauxDisponiblesUseCase(DisponibiliteRepository dispoRepo,
                                          RendezVousRepository rdvRepo) {
        this.dispoRepo = dispoRepo;
        this.rdvRepo   = rdvRepo;
    }

    public List<Creneau> execute(UUID medecinId, LocalDate date) {
        var dispoOpt = dispoRepo.findByMedecinIdAndJour(medecinId, date.getDayOfWeek());
        if (dispoOpt.isEmpty()) return List.of();
        Disponibilite dispo = dispoOpt.get();

        Set<LocalTime> heuresPrises = rdvRepo
            .findByMedecinIdAndDate(medecinId, date)
            .stream()
            .map(RendezVous::heureRdv)
            .collect(Collectors.toSet());

        List<Creneau> creneaux = new ArrayList<>();
        LocalTime current = dispo.heureDebut();
        int duree = dispo.dureeConsultation();

        while (!current.plusMinutes(duree).isAfter(dispo.heureFin())) {
            LocalTime fin = current.plusMinutes(duree);
            boolean libre = !heuresPrises.contains(current);
            creneaux.add(new Creneau(current, fin, libre));
            current = fin;
        }

        return creneaux;
    }
}