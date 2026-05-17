package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.PatientSummary;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class GetPatientsMedecinUseCase {

    private final RendezVousRepository rdvRepo;

    public GetPatientsMedecinUseCase(RendezVousRepository rdvRepo) {
        this.rdvRepo = rdvRepo;
    }

    public List<PatientSummary> execute(UUID medecinId, String search, String filtre, int page, int size) {
        String s = search == null ? "" : search.trim();
        String f = filtre == null || filtre.isBlank() ? "TOUS" : filtre.toUpperCase();
        return rdvRepo.findPatientsByMedecinId(medecinId, s, f, page, size);
    }

    public long count(UUID medecinId, String search, String filtre) {
        String s = search == null ? "" : search.trim();
        String f = filtre == null || filtre.isBlank() ? "TOUS" : filtre.toUpperCase();
        return rdvRepo.countPatientsByMedecinId(medecinId, s, f);
    }
}
