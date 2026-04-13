package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GetDisponibilitesUseCase {

    private final DisponibiliteRepository dispoRepo;

    public GetDisponibilitesUseCase(DisponibiliteRepository dispoRepo) {
        this.dispoRepo = dispoRepo;
    }

    public List<Disponibilite> execute(UUID medecinId) {
        return dispoRepo.findByMedecinId(medecinId);
    }
}
