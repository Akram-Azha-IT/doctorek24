package ma.doctorek.doctorek.agenda.application;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousNotFoundException;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.RdvNonAnnulableException;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AnnulerRendezVousUseCase {

    private final RendezVousRepository rdvRepo;

    public AnnulerRendezVousUseCase(RendezVousRepository rdvRepo) {
        this.rdvRepo = rdvRepo;
    }

    public RendezVous execute(UUID rdvId) {
        RendezVous rdv = rdvRepo.findById(rdvId)
            .orElseThrow(() -> new RendezVousNotFoundException(rdvId));

        if (rdv.statut() == StatutRdv.ANNULE || rdv.statut() == StatutRdv.TERMINE) {
            throw new RdvNonAnnulableException(rdvId, rdv.statut());
        }

        return rdvRepo.save(rdv.annuler());
    }
}
