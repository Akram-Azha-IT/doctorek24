package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.CarteVirtuelleEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record CarteSummaryResponse(
        UUID id,
        UUID patientId,
        String cardRef,
        String statut,
        String groupeSanguin,
        Boolean donneurOrganes,
        LocalDateTime createdAt) {

    public static CarteSummaryResponse from(CarteVirtuelleEntity e) {
        return new CarteSummaryResponse(
                e.getId(),
                e.getPatientId(),
                e.getCardRef(),
                e.getStatut(),
                e.getGroupeSanguin(),
                e.getDonneurOrganes(),
                e.getCreatedAt());
    }
}
