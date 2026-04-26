package ma.doctorek.doctorek.agenda.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import ma.doctorek.doctorek.agenda.domain.FrequenceDisponibilite;
import ma.doctorek.doctorek.agenda.domain.TypeFinRecurrence;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

public record DefineDisponibiliteRequest(
    @NotNull(message = "Le jour de la semaine est obligatoire")
    DayOfWeek jourSemaine,

    @NotNull(message = "L'heure de début est obligatoire")
    LocalTime heureDebut,

    @NotNull(message = "L'heure de fin est obligatoire")
    LocalTime heureFin,

    @Min(value = 10, message = "La durée minimale de consultation est de 10 minutes")
    @Max(value = 120, message = "La durée maximale de consultation est de 120 minutes")
    int dureeConsultation,

    FrequenceDisponibilite frequence,

    @Min(value = 1, message = "L'intervalle doit être au moins 1 semaine")
    @Max(value = 52, message = "L'intervalle ne peut pas dépasser 52 semaines")
    Integer intervalSemaines,

    LocalDate dateDebut,

    TypeFinRecurrence typeFinRecurrence,

    LocalDate dateFin
) {}
