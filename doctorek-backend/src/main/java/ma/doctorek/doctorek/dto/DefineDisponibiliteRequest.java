package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotNull;
import ma.doctorek.doctorek.enums.FrequenceDisponibilite;
import ma.doctorek.doctorek.enums.TypeFinRecurrence;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

public record DefineDisponibiliteRequest(
        @NotNull DayOfWeek jourSemaine,
        @NotNull LocalTime heureDebut,
        @NotNull LocalTime heureFin,
        int dureeConsultation,
        FrequenceDisponibilite frequence,
        Integer intervalSemaines,
        LocalDate dateDebut,
        TypeFinRecurrence typeFinRecurrence,
        LocalDate dateFin) {}
