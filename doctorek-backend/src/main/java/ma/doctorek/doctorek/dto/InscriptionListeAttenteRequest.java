package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

/** Demande d'inscription en liste d'attente sur une plage de dates. */
public record InscriptionListeAttenteRequest(
        @NotNull UUID medecinId,
        @NotNull UUID patientId,
        @NotNull LocalDate dateDebut,
        @NotNull LocalDate dateFin) {}
