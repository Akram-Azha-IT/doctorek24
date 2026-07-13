package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.RdvDocumentRequisEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentRequisResponse(
        UUID id,
        UUID rdvId,
        String libelle,
        boolean fourni,
        LocalDateTime createdAt) {

    public static DocumentRequisResponse from(RdvDocumentRequisEntity e) {
        return new DocumentRequisResponse(e.getId(), e.getRdvId(), e.getLibelle(), e.isFourni(), e.getCreatedAt());
    }
}
