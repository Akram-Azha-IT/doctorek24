package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class GetRdvsPatientUseCase {

    private final RendezVousRepository rdvRepo;

    public GetRdvsPatientUseCase(RendezVousRepository rdvRepo) {
        this.rdvRepo = rdvRepo;
    }

    public List<RendezVous> execute(UUID patientId) {
        return rdvRepo.findByPatientId(patientId, 0, 200);
    }

    public List<RendezVous> execute(UUID patientId, int page, int size) {
        return rdvRepo.findByPatientId(patientId, page, size);
    }
}
