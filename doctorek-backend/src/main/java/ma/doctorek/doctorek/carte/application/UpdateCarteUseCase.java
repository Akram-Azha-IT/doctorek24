package ma.doctorek.doctorek.carte.application;

import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleRequest;
import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.carte.domain.CarteNotFoundException;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelle;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UpdateCarteUseCase {

    private final CarteVirtuelleRepository repository;

    public UpdateCarteUseCase(CarteVirtuelleRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CarteVirtuelleResponse execute(UUID patientId, CarteVirtuelleRequest req) {
        CarteVirtuelle existing = repository.findByPatientId(patientId)
                .orElseThrow(() -> new CarteNotFoundException("Carte non trouvée pour patient: " + patientId));

        CarteVirtuelle updated = new CarteVirtuelle(
                existing.id(),
                existing.patientId(),
                existing.cardRef(),
                existing.statut(),
                req.dateNaissance(),
                req.genre(),
                req.nationalite(),
                req.numIdentite(),
                req.photoUrl(),
                req.telephone(),
                req.adresseRue(),
                req.adresseVille(),
                req.adressePays(),
                req.groupeSanguin(),
                req.tailleCm(),
                req.poidsKg(),
                req.donneurOrganes(),
                req.allergies() != null ? req.allergies() : List.of(),
                req.maladiesChroniques() != null ? req.maladiesChroniques() : List.of(),
                req.medicamentsActuels() != null
                        ? req.medicamentsActuels().stream()
                                .map(d -> new CarteVirtuelle.MedicamentActuel(d.nom(), d.dosage()))
                                .toList()
                        : List.of(),
                req.antecedentsChirurgicaux() != null
                        ? req.antecedentsChirurgicaux().stream()
                                .map(d -> new CarteVirtuelle.AntecedentChirurgical(d.description(), d.date()))
                                .toList()
                        : List.of(),
                req.vaccinations() != null ? req.vaccinations() : List.of(),
                req.antecedentsFamiliaux() != null ? req.antecedentsFamiliaux() : List.of(),
                req.contactsUrgence() != null
                        ? req.contactsUrgence().stream()
                                .map(d -> new CarteVirtuelle.ContactUrgence(d.nom(), d.lien(), d.telephone()))
                                .toList()
                        : List.of(),
                req.medecinTraitant(),
                req.assuranceNom(),
                req.assuranceNumero(),
                req.assuranceDetails(),
                existing.createdAt(),
                null
        );

        CarteVirtuelle saved = repository.save(updated);
        repository.logAudit(saved.id(), "UPDATE", patientId);
        return CarteVirtuelleResponse.from(saved);
    }
}
