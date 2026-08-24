package ma.doctorek.doctorek.agent.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Rendez-vous du patient connecté, réduit à ce qui permet au modèle d'y référer.
 *
 * <p>Le motif et le questionnaire pré-consultation sont exclus : ce sont des
 * données de santé, et rien dans les cas d'usage de la v1 ne justifie de les
 * envoyer à un fournisseur de modèle externe.
 */
public record RdvCompact(
        UUID id,
        LocalDate date,
        LocalTime heure,
        String statut,
        String medecinNom) {
}
