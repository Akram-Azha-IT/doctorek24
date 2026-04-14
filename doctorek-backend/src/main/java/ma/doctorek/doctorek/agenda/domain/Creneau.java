package ma.doctorek.doctorek.agenda.domain;

import java.time.LocalTime;

public record Creneau(LocalTime debut, LocalTime fin, boolean disponible) {}