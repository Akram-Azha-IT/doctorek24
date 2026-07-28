package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.enums.StatutRdv;

import java.time.LocalDate;
import java.util.UUID;

public record PatientSummaryResponse(
        UUID patientId,
        String firstName,
        String lastName,
        String photoUrl,
        /** Renseignés quand le patient est un proche rattaché à un compte titulaire. */
        String gestionnaireId,
        String gestionnaireNom,
        LocalDate dernierRdvDate,
        StatutRdv dernierRdvStatut,
        boolean hasFutureRdv) {}
