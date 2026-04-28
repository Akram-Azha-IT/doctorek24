package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.application.dto.InfosMedicalesResponse;
import ma.doctorek.doctorek.dossier.application.dto.UpsertInfosMedicalesRequest;
import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import ma.doctorek.doctorek.dossier.domain.InfosMedicales;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UpsertInfosMedicalesUseCase {

    private final DossierRepository repository;

    public UpsertInfosMedicalesUseCase(DossierRepository repository) {
        this.repository = repository;
    }

    public InfosMedicalesResponse execute(UUID patientId, UpsertInfosMedicalesRequest req) {
        var infos = new InfosMedicales(
            patientId,
            req.groupeSanguin(),
            req.allergies(),
            req.antecedents(),
            req.traitementsCours(),
            req.notesGenerales()
        );
        return InfosMedicalesResponse.from(repository.saveInfos(infos));
    }
}
