package ma.doctorek.doctorek.agent.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Créneaux libres d'un jour, réduits à des heures « HH:mm » pour le modèle.
 *
 * <p>Les créneaux occupés ne sont pas transmis : le modèle n'a rien à en faire,
 * et une journée chargée doublerait la taille du contexte pour rien.
 */
public record CreneauxCompact(LocalDate date, List<String> heuresLibres) {
}
