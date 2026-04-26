package ma.doctorek.doctorek.agenda.domain;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record Disponibilite(
    UUID                   id,
    UUID                   medecinId,
    DayOfWeek              jourSemaine,
    LocalTime              heureDebut,
    LocalTime              heureFin,
    int                    dureeConsultation,
    FrequenceDisponibilite frequence,
    int                    intervalSemaines,
    LocalDate              dateDebut,
    TypeFinRecurrence      typeFinRecurrence,
    LocalDate              dateFin
) {}
