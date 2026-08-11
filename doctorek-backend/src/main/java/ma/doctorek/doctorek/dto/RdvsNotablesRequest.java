package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Rendez-vous affichés au patient, dont il veut savoir lesquels il peut encore noter.
 *
 * <p>Passe en POST plutôt qu'en query : la liste suit la pagination de l'écran « mes
 * rendez-vous » et dépasserait vite la longueur raisonnable d'une URL.
 */
public record RdvsNotablesRequest(@NotNull List<UUID> rdvIds) {}
