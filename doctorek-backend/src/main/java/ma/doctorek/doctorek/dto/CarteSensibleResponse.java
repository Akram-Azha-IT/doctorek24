package ma.doctorek.doctorek.dto;

import java.util.List;

/**
 * Partie sensible de la carte, servie seulement après validation d'un OTP envoyé au
 * patient (consentement). Ne quitte jamais le serveur sans jeton d'accès valide.
 */
public record CarteSensibleResponse(
        List<MedicamentActuelDto> medicamentsActuels,
        List<AntecedentChirurgicalDto> antecedentsChirurgicaux,
        List<String> vaccinations,
        List<String> antecedentsFamiliaux,
        String medecinTraitant,
        String assuranceNom,
        String assuranceNumero,
        String assuranceDetails) {}
