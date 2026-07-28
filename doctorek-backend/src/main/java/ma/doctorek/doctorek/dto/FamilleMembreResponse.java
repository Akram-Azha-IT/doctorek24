package ma.doctorek.doctorek.dto;

import java.util.UUID;

/** Membre du foyer affiché dans le dossier patient côté médecin. */
public record FamilleMembreResponse(
        UUID patientId,
        String firstName,
        String lastName,
        String photoUrl,
        String gestionnaireId,
        String gestionnaireNom) {}
