package ma.doctorek.doctorek.dto;

import java.math.BigDecimal;
import java.util.List;

public record CarteVirtuelleRequest(
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
        String assuranceDetails) {}
