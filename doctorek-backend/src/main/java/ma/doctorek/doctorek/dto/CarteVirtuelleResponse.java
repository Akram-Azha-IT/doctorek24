package ma.doctorek.doctorek.dto;

import java.math.BigDecimal;
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
        String assuranceDetails,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}
