package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.application.dto.CreateOrdonnanceRequest;
import ma.doctorek.doctorek.dossier.application.dto.OrdonnanceResponse;
import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import ma.doctorek.doctorek.dossier.domain.Medicament;
import ma.doctorek.doctorek.dossier.domain.Ordonnance;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class CreateOrdonnanceUseCase {

    private final DossierRepository repository;

    public CreateOrdonnanceUseCase(DossierRepository repository) {
        this.repository = repository;
    }

    public OrdonnanceResponse execute(UUID patientId, CreateOrdonnanceRequest req) {
        List<Medicament> meds = req.medicaments() == null ? List.of() :
            req.medicaments().stream()
                .map(m -> new Medicament(m.nom(), m.dosage(), m.frequence(), m.duree()))
                .toList();

        var ordonnance = new Ordonnance(null, patientId, req.medecinId(), LocalDate.now(), meds, req.notes());
        return OrdonnanceResponse.from(repository.saveOrdonnance(ordonnance));
    }
}
