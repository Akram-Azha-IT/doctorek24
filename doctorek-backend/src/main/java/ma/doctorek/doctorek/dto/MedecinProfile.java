package ma.doctorek.doctorek.dto;

import java.util.UUID;

public record MedecinProfile(
        UUID id,
        String firstName,
        String lastName,
        String specialite,
        String ville,
        String adresse,
        String inpe,
        Double latitude,
        Double longitude,
        String photoUrl) {}
