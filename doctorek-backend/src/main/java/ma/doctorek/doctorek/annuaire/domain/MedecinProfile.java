package ma.doctorek.doctorek.annuaire.domain;

import java.util.UUID;

public record MedecinProfile(
    UUID   id,
    String firstName,
    String lastName,
    String specialite,
    String ville,
    String adresse,
    String inpe
) {}
