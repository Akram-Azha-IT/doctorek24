package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record PrendreRdvRequest(
        @NotNull UUID medecinId,
        @NotNull UUID patientId,
        @NotNull @FutureOrPresent LocalDate dateRdv,
        @NotNull LocalTime heureRdv,
        String motif,
        QuestionnaireDto questionnaire) {}
