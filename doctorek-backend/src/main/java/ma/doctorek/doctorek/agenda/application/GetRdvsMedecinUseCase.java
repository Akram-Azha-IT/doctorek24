package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GetRdvsMedecinUseCase {

    private final RendezVousRepository rdvRepo;

    public GetRdvsMedecinUseCase(RendezVousRepository rdvRepo) {
        this.rdvRepo = rdvRepo;
    }

    public List<RendezVous> execute(UUID medecinId) {
        return rdvRepo.findByMedecinId(medecinId);
    }
}
