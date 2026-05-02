package ma.doctorek.doctorek.carte.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CarteVirtuelleRequest(
        UUID patientId,
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
        List<MedicamentActuelDto> medicamentsActuels,
        List<AntecedentChirurgicalDto> antecedentsChirurgicaux,
        List<String> vaccinations,
        List<String> antecedentsFamiliaux,
        List<ContactUrgenceDto> contactsUrgence,
        String medecinTraitant,
        String assuranceNom,
        String assuranceNumero,
        String assuranceDetails
) {}
