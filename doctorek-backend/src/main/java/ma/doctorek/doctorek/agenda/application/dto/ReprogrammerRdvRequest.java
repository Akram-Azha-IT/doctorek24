package ma.doctorek.doctorek.agenda.application.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReprogrammerRdvRequest(
    @NotNull LocalDate nouvelleDateRdv,
    @NotNull LocalTime nouvelleHeureRdv
) {}
