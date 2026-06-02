package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterMedecinRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Pattern(regexp = "^\\+?[0-9]{9,15}$") String phone,
        @NotBlank String inpe,
        @NotBlank String specialite,
        @NotBlank String ville,
        String lang) {

    public RegisterMedecinRequest {
        if (lang == null || lang.isBlank()) lang = "fr";
    }
}
