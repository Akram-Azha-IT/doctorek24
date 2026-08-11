package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Dépôt d'un avis.
 *
 * <p>Le rendez-vous porte l'éligibilité : le médecin et le patient s'en déduisent, le
 * client ne les fournit pas — sinon on pourrait noter un médecin jamais consulté.
 */
public record CreerAvisRequest(
        @NotNull UUID rdvId,
        @NotNull @Min(1) @Max(5) Integer note,
        @Size(max = 2000, message = "Le commentaire ne peut pas dépasser 2000 caractères")
        String commentaire,
        boolean anonyme) {}
