package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import ma.doctorek.doctorek.enums.RoleGestion;

import java.time.LocalDate;

public record AddProcheRequest(
        @NotBlank String nom,
        @NotBlank String prenom,
        @NotNull @Past LocalDate dateNaissance,
        String lieuNaissance,
        @Email String email,
        String telephone,
        @NotNull RoleGestion role,
        @AssertTrue(message = "La déclaration de représentant légal est obligatoire")
        boolean declarationRepresentantLegal) {
}
