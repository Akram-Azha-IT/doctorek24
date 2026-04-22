package ma.doctorek.doctorek.agenda.application.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.agenda.domain.RendezVous;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RendezVousResponse(
    UUID             id,
    UUID             medecinId,
    UUID             patientId,
    String           patientPrenom,
    String           patientNom,
    LocalDate        dateRdv,
    LocalTime        heureRdv,
    int              duree,
    String           statut,
    String           motif,
    QuestionnaireDto questionnaire
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static RendezVousResponse from(RendezVous rdv) {
        return new RendezVousResponse(
            rdv.id(), rdv.medecinId(), rdv.patientId(),
            null, null,
            rdv.dateRdv(), rdv.heureRdv(), rdv.duree(),
            rdv.statut().name(), rdv.motif(),
            parseQuestionnaire(rdv.questionnaireJson())
        );
    }

    public static RendezVousResponse from(RendezVous rdv, String patientPrenom, String patientNom) {
        return new RendezVousResponse(
            rdv.id(), rdv.medecinId(), rdv.patientId(),
            patientPrenom, patientNom,
            rdv.dateRdv(), rdv.heureRdv(), rdv.duree(),
            rdv.statut().name(), rdv.motif(),
            parseQuestionnaire(rdv.questionnaireJson())
        );
    }

    private static QuestionnaireDto parseQuestionnaire(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readValue(json, QuestionnaireDto.class);
        } catch (Exception e) {
            return null;
        }
    }
}
