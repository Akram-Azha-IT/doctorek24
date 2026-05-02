package ma.doctorek.doctorek.carte.application;

import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleRequest;
import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelle;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.HexFormat;
import java.security.SecureRandom;

@Service
public class CreateCarteUseCase {

    private final CarteVirtuelleRepository repository;

    public CreateCarteUseCase(CarteVirtuelleRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CarteVirtuelleResponse execute(CarteVirtuelleRequest req) {
        String cardRef = generateCardRef();

        CarteVirtuelle carte = new CarteVirtuelle(
                null,
                req.patientId(),
                cardRef,
                "VIRTUEL",
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
                null,
                null
        );

        CarteVirtuelle saved = repository.save(carte);
        repository.logAudit(saved.id(), "CREATE", req.patientId());
        return CarteVirtuelleResponse.from(saved);
    }

    private String generateCardRef() {
        byte[] bytes = new byte[4];
        new SecureRandom().nextBytes(bytes);
        String hex = HexFormat.of().formatHex(bytes).toUpperCase();
        return "VMC-" + Year.now().getValue() + "-" + hex;
    }
}
