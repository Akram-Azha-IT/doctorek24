package ma.doctorek.doctorek.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Sous-ensemble d'urgence de la carte, exposé sans authentification au scan du QR.
 * Contient uniquement le vital utile aux secours (jamais les données sensibles :
 * medicaments, antecedents, assurance, medecin traitant), qui passent par l'OTP.
 */
public record CartePublicResponse(
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
        List<ContactUrgenceDto> contactsUrgence,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}
