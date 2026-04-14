package ma.doctorek.doctorek.agenda.application.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record PrendreRdvRequest(
    @NotNull(message = "L'identifiant du médecin est obligatoire")
    UUID medecinId,

    @NotNull(message = "L'identifiant du patient est obligatoire")
    UUID patientId,

    @NotNull(message = "La date du rendez-vous est obligatoire")
    @Future(message = "La date du rendez-vous doit être dans le futur")
    LocalDate dateRdv,

    @NotNull(message = "L'heure du rendez-vous est obligatoire")
    LocalTime heureRdv,

    String motif
) {}
