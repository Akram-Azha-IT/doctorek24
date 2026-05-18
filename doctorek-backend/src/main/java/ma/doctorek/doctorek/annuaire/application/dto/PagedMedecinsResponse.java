package ma.doctorek.doctorek.annuaire.application.dto;

import ma.doctorek.doctorek.annuaire.domain.MedecinProfile;

import java.util.List;

public record PagedMedecinsResponse(
    List<MedecinProfile> content,
    long totalElements,
    int totalPages,
    int page,
    int size
) {}
