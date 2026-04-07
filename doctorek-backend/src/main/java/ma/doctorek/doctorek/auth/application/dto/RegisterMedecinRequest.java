package ma.doctorek.doctorek.auth.application.dto;

import jakarta.validation.constraints.*;

public record RegisterMedecinRequest(

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Phone is required")
    @Pattern(
        regexp = "^(\\+212|0)(6|7)[0-9]{8}$",
        message = "Phone must be a valid Moroccan number (e.g. 0612345678)"
    )
    String phone,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    String firstName,

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    String lastName,

    @NotBlank(message = "INPE is required")
    @Pattern(
        regexp = "^[0-9]{10}$",
        message = "INPE must be a 10-digit number"
    )
    String inpe,

    @NotBlank(message = "Specialite is required")
    @Size(max = 100, message = "Specialite must not exceed 100 characters")
    String specialite,

    @NotBlank(message = "Ville is required")
    @Size(max = 100, message = "Ville must not exceed 100 characters")
    String ville,

    @Size(max = 500, message = "Adresse must not exceed 500 characters")
    String adresse,

    @Pattern(regexp = "^(fr|ar)$", message = "Lang must be 'fr' or 'ar'")
    String lang
) {
    public RegisterMedecinRequest {
        if (lang == null || lang.isBlank()) lang = "fr";
    }
}
