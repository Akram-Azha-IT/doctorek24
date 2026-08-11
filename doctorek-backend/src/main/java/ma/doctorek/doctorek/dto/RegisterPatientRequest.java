package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterPatientRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Pattern(regexp = "^\\+?[0-9]{9,15}$") String phone,
        /**
         * Consentement au traitement des données (loi 09-08).
         *
         * <p>Vérifié ici et pas seulement dans le formulaire : une case décochée peut
         * franchir le navigateur, et un compte créé sans accord est un traitement sans
         * base légale.
         */
        @AssertTrue(message = "Le consentement au traitement des données est obligatoire.")
        boolean consentementDonnees,
        String lang) {

    public RegisterPatientRequest {
        if (lang == null || lang.isBlank()) lang = "fr";
    }
}
