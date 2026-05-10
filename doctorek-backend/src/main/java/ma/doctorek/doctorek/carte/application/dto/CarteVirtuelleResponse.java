package ma.doctorek.doctorek.carte.application.dto;

import ma.doctorek.doctorek.carte.domain.CarteVirtuelle;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CarteVirtuelleResponse(
        UUID id,
        UUID patientId,
        String cardRef,
        String statut,
        String firstName,
        String lastName,
        LocalDate dateNaissance,
        String genre,
        String nationalite,
        String numIdentite,
        String photoUrl,
        String telephone,
        String adresseRue,
        String adresseVille,
        String adressePays,
        String groupeSanguin,
        Integer tailleCm,
        BigDecimal poidsKg,
        Boolean donneurOrganes,
        List<String> allergies,
        List<String> maladiesChroniques,
        List<CarteVirtuelle.MedicamentActuel> medicamentsActuels,
        List<CarteVirtuelle.AntecedentChirurgical> antecedentsChirurgicaux,
        List<String> vaccinations,
        List<String> antecedentsFamiliaux,
        List<CarteVirtuelle.ContactUrgence> contactsUrgence,
        String medecinTraitant,
        String assuranceNom,
        String assuranceNumero,
        String assuranceDetails,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CarteVirtuelleResponse from(CarteVirtuelle c, String firstName, String lastName) {
        return new CarteVirtuelleResponse(
                c.id(), c.patientId(), c.cardRef(), c.statut(),
                firstName, lastName,
                c.dateNaissance(), c.genre(), c.nationalite(), c.numIdentite(), c.photoUrl(),
                c.telephone(), c.adresseRue(), c.adresseVille(), c.adressePays(),
                c.groupeSanguin(), c.tailleCm(), c.poidsKg(), c.donneurOrganes(),
                c.allergies(), c.maladiesChroniques(), c.medicamentsActuels(),
                c.antecedentsChirurgicaux(), c.vaccinations(), c.antecedentsFamiliaux(),
                c.contactsUrgence(), c.medecinTraitant(),
                c.assuranceNom(), c.assuranceNumero(), c.assuranceDetails(),
                c.createdAt(), c.updatedAt()
        );
    }
}
