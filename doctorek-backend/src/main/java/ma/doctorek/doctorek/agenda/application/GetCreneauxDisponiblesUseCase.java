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
import java.util.Comparator;
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
        List<Disponibilite> dispos = dispoRepo.findAllByMedecinIdAndJour(medecinId, date.getDayOfWeek());
        if (dispos.isEmpty()) return List.of();

        Set<LocalTime> heuresPrises = rdvRepo
            .findByMedecinIdAndDate(medecinId, date)
            .stream()
            .filter(r -> r.statut() != ma.doctorek.doctorek.agenda.domain.StatutRdv.ANNULE)
            .map(RendezVous::heureRdv)
            .collect(Collectors.toSet());

        List<Creneau> creneaux = new ArrayList<>();

        for (Disponibilite dispo : dispos) {
            LocalTime current = dispo.heureDebut();
            int duree = dispo.dureeConsultation();

            if (duree <= 0) continue; // Prevent infinite loop if duration is invalid

            while (true) {
                LocalTime fin = current.plusMinutes(duree);

                // Stop if adding duration wraps around midnight
                if (fin.isBefore(current) && !fin.equals(LocalTime.MIDNIGHT)) {
                    // Note: if fin is exactly 00:00, it's considered next day midnight, which might be valid 
                    // if heureFin is also 23:59 or 00:00. But let's be safe.
                    if (fin.isBefore(current) && fin != LocalTime.MIDNIGHT) {
                         break;
                    }
                }

                // Stop if the calculated end time is after the availability's end time
                // Special case: if fin is 00:00, it might be valid if heureFin is 23:59
                if (fin.isAfter(dispo.heureFin()) && fin != LocalTime.MIDNIGHT) {
                    break;
                }
                
                // Strict check for wrap around if we are not at midnight
                if (fin.isBefore(current) && fin != LocalTime.MIDNIGHT) {
                    break;
                }

                boolean libre = !heuresPrises.contains(current);
                creneaux.add(new Creneau(current, fin, libre));
                current = fin;
                
                // If we exactly reached midnight, break to avoid wrapping to the next day in the loop
                if (current.equals(LocalTime.MIDNIGHT) || current.equals(dispo.heureFin())) {
                    break;
                }
            }
        }

        creneaux.sort(Comparator.comparing(Creneau::debut));
        return creneaux;
    }
}