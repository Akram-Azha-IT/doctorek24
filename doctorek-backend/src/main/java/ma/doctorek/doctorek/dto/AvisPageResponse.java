package ma.doctorek.doctorek.dto;

import java.util.List;

/**
 * Page d'avis, accompagnée de la synthèse du médecin.
 *
 * <p>Moyenne et répartition voyagent avec la première page : l'en-tête du profil les
 * affiche immédiatement, sans second aller-retour.
 */
public record AvisPageResponse(
        List<AvisResponse> content,
        long totalElements,
        int totalPages,
        int page,
        int size,
        Double noteMoyenne,
        long nombreAvis,
        List<Integer> repartition) {}
