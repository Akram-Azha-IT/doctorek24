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
        return from(e, firstName, lastName, null);
    }

    /**
     * @param fallbackPhotoUrl used when the patient never uploaded a photo (e.g. a Google
     *                         sign-in's avatar) so the dashboard/carte still show a picture.
     */
    public static PatientDetailResponse from(PatientDetailEntity e, String firstName, String lastName,
                                             String fallbackPhotoUrl) {
        String photoUrl = (e.getPhotoUrl() != null && !e.getPhotoUrl().isBlank())
                ? e.getPhotoUrl()
                : fallbackPhotoUrl;
        return new PatientDetailResponse(
                e.getUserId(),
                firstName,
                lastName,
                e.getDateNaissance(),
                e.getGenre(),
                e.getNationalite(),
                e.getNumIdentite(),
                photoUrl,
                e.getTelephone(),
                e.getAdresseRue(),
                e.getAdresseVille(),
                e.getAdressePays(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }
}
