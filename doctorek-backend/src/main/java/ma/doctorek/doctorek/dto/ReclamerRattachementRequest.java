package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ma.doctorek.doctorek.enums.RoleGestion;

/**
 * Réclamation d'un rattachement. Deux cas :
 * - pourMoi = true : le RDV est pour le titulaire lui-même → fusion avec son profil,
 *   role/declaration ignorés ;
 * - pourMoi = false : le RDV est pour un proche → role et declaration obligatoires
 *   (validés dans RattachementService, car conditionnels).
 */
public record ReclamerRattachementRequest(
        @NotBlank @Size(min = 3, max = 3, message = "Saisissez exactement les 3 premières lettres du nom")
        String troisLettres,
        boolean pourMoi,
        RoleGestion role,
        Boolean declarationRepresentantLegal) {
}
