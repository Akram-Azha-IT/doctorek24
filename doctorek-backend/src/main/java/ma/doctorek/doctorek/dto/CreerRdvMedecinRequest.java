package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** Création d'un RDV par le praticien : patient existant OU nouveau patient sans compte. */
public record CreerRdvMedecinRequest(
        UUID patientId,
        @Valid NouveauPatient nouveauPatient,
        @NotNull @FutureOrPresent LocalDate dateRdv,
        @NotNull LocalTime heureRdv,
        String motif) {

    public record NouveauPatient(
            @NotBlank String nom,
            @NotBlank String prenom,
            @Past LocalDate dateNaissance,
            @Email String email,
            String telephone) {
    }
}
