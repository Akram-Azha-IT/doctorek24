package ma.doctorek.doctorek.admin.application.dto;

import ma.doctorek.doctorek.carte.infrastructure.CarteVirtuelleEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record CarteSummaryResponse(
        UUID id,
        UUID patientId,
        String cardRef,
        String statut,
        String groupeSanguin,
        String adresseVille,
        String adressePays,
        Boolean donneurOrganes,
        LocalDateTime createdAt
) {
    public static CarteSummaryResponse from(CarteVirtuelleEntity e) {
        return new CarteSummaryResponse(
                e.getId(),
                e.getPatientId(),
                e.getCardRef(),
                e.getStatut(),
                e.getGroupeSanguin(),
                e.getAdresseVille(),
                e.getAdressePays(),
                e.getDonneurOrganes(),
                e.getCreatedAt()
        );
    }
}
