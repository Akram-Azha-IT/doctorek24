package ma.doctorek.doctorek.auth.application.dto;

import jakarta.validation.constraints.*;

public record RegisterPatientRequest(

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

    @Pattern(regexp = "^(fr|ar)$", message = "Lang must be 'fr' or 'ar'")
    String lang
) {
    public RegisterPatientRequest {
        if (lang == null || lang.isBlank()) lang = "fr";
    }
}
