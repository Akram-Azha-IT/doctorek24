package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReprogrammerRdvRequest(
        @NotNull @FutureOrPresent LocalDate dateRdv,
        @NotNull LocalTime heureRdv) {}
