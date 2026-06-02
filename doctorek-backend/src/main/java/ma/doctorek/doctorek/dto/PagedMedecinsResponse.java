package ma.doctorek.doctorek.dto;

import java.util.List;

public record PagedMedecinsResponse(
        List<MedecinProfile> content,
        long totalElements,
        int totalPages,
        int page,
        int size) {}
