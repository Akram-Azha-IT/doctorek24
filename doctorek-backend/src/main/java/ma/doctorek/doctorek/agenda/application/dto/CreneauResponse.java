package ma.doctorek.doctorek.agenda.application.dto;

import ma.doctorek.doctorek.agenda.domain.Creneau;

public record CreneauResponse(String debut, String fin, boolean disponible) {
    public static CreneauResponse from(Creneau c) {
        return new CreneauResponse(c.debut().toString(), c.fin().toString(), c.disponible());
    }
}