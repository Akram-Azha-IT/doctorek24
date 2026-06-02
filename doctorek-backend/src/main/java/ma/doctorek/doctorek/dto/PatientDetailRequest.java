package ma.doctorek.doctorek.dto;

import java.time.LocalDate;

public record PatientDetailRequest(
        LocalDate dateNaissance,
        String genre,
        String nationalite,
        String numIdentite,
        String photoUrl,
        String telephone,
        String adresseRue,
        String adresseVille,
        String adressePays) {}
