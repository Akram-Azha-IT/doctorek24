package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.application.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.agenda.domain.CreneauIndisponibleException;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import ma.doctorek.doctorek.agenda.domain.MedecinSansAgendaException;
import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PrendreRdvUseCase {

    private final DisponibiliteRepository dispoRepo;
    private final RendezVousRepository    rdvRepo;

    public PrendreRdvUseCase(DisponibiliteRepository dispoRepo,
                              RendezVousRepository rdvRepo) {
        this.dispoRepo = dispoRepo;
        this.rdvRepo   = rdvRepo;
    }

    public RendezVous execute(PrendreRdvRequest request) {
        Disponibilite dispo = dispoRepo
            .findByMedecinIdAndJour(request.medecinId(), request.dateRdv().getDayOfWeek())
            .orElseThrow(() -> new MedecinSansAgendaException(request.medecinId()));

        if (rdvRepo.existsByMedecinIdAndDateAndHeure(
                request.medecinId(), request.dateRdv(), request.heureRdv())) {
            throw new CreneauIndisponibleException(
                "Créneau indisponible : " + request.dateRdv() + " à " + request.heureRdv());
        }

        RendezVous rdv = new RendezVous(
            null,
            request.medecinId(),
            request.patientId(),
            request.dateRdv(),
            request.heureRdv(),
            dispo.dureeConsultation(),
            StatutRdv.EN_ATTENTE,
            request.motif(),
            LocalDateTime.now()
        );

        return rdvRepo.save(rdv);
    }
}
