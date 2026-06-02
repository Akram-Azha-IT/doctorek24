package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.PatientDetailEntity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PatientDetailResponse(
        UUID userId,
        String firstName,
        String lastName,
        LocalDate dateNaissance,
        String genre,
        String nationalite,
        String numIdentite,
        String photoUrl,
        String telephone,
        String adresseRue,
        String adresseVille,
        String adressePays,
        Instant createdAt,
        Instant updatedAt) {

    public static PatientDetailResponse from(PatientDetailEntity e, String firstName, String lastName) {
        return new PatientDetailResponse(
                e.getUserId(),
                firstName,
                lastName,
                e.getDateNaissance(),
                e.getGenre(),
                e.getNationalite(),
                e.getNumIdentite(),
                e.getPhotoUrl(),
                e.getTelephone(),
                e.getAdresseRue(),
                e.getAdresseVille(),
                e.getAdressePays(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }
}
