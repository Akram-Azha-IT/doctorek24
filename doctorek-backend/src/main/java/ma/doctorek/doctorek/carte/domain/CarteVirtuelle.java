package ma.doctorek.doctorek.carte.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CarteVirtuelle(
        UUID id,
        UUID patientId,
        String cardRef,
        String statut,
        // Identity
        LocalDate dateNaissance,
        String genre,
        String nationalite,
        String numIdentite,
        String photoUrl,
        // Contact
        String telephone,
        String adresseRue,
        String adresseVille,
        String adressePays,
        // Medical basics
        String groupeSanguin,
        Integer tailleCm,
        BigDecimal poidsKg,
        Boolean donneurOrganes,
        // Medical history (raw lists — encrypted at persistence layer)
        List<String> allergies,
        List<String> maladiesChroniques,
        List<MedicamentActuel> medicamentsActuels,
        List<AntecedentChirurgical> antecedentsChirurgicaux,
        List<String> vaccinations,
        List<String> antecedentsFamiliaux,
        // Emergency
        List<ContactUrgence> contactsUrgence,
        String medecinTraitant,
        // Insurance
        String assuranceNom,
        String assuranceNumero,
        String assuranceDetails,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record MedicamentActuel(String nom, String dosage) {}
    public record AntecedentChirurgical(String description, String date) {}
    public record ContactUrgence(String nom, String lien, String telephone) {}
}
