package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.application.dto.RendezVousResponse;
import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class GetRdvsMedecinUseCase {

    private final RendezVousRepository rdvRepo;
    private final UserRepository       userRepo;

    public GetRdvsMedecinUseCase(RendezVousRepository rdvRepo, UserRepository userRepo) {
        this.rdvRepo  = rdvRepo;
        this.userRepo = userRepo;
    }

    public List<RendezVousResponse> execute(UUID medecinId) {
        return enrich(rdvRepo.findByMedecinId(medecinId, 0, 500));
    }

    public List<RendezVousResponse> execute(UUID medecinId, int page, int size) {
        return enrich(rdvRepo.findByMedecinId(medecinId, page, size));
    }

    private List<RendezVousResponse> enrich(List<RendezVous> rdvs) {
        return rdvs.stream()
            .map(rdv -> userRepo.findById(rdv.patientId())
                .map(u -> RendezVousResponse.from(rdv, u.getFirstName(), u.getLastName()))
                .orElseGet(() -> RendezVousResponse.from(rdv)))
            .toList();
    }
}
