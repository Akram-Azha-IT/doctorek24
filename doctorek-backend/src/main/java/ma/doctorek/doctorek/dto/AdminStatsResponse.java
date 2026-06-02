package ma.doctorek.doctorek.dto;

public record AdminStatsResponse(
        long totalPatients,
        long totalMedecins,
        long totalRdvs,
        long rdvsAujourdhui,
        long rdvsEnAttente,
        long totalCartes) {}
