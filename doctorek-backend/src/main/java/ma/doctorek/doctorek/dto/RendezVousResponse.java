package ma.doctorek.doctorek.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.entity.RendezVousEntity;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RendezVousResponse(
        UUID id,
        UUID medecinId,
        UUID patientId,
        String patientPrenom,
        String patientNom,
        LocalDate dateRdv,
        LocalTime heureRdv,
        int duree,
        String statut,
        String motif,
        QuestionnaireDto questionnaire) {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static RendezVousResponse from(RendezVousEntity rdv) {
        return new RendezVousResponse(
                rdv.getId(),
                rdv.getMedecinId(),
                rdv.getPatientId(),
                null,
                null,
                rdv.getDateRdv(),
                rdv.getHeureRdv(),
                rdv.getDuree(),
                rdv.getStatut(),
                rdv.getMotif(),
                parseQuestionnaire(rdv.getQuestionnaireJson()));
    }

    public static RendezVousResponse from(RendezVousEntity rdv, String patientPrenom, String patientNom) {
        return new RendezVousResponse(
                rdv.getId(),
                rdv.getMedecinId(),
                rdv.getPatientId(),
                patientPrenom,
                patientNom,
                rdv.getDateRdv(),
                rdv.getHeureRdv(),
                rdv.getDuree(),
                rdv.getStatut(),
                rdv.getMotif(),
                parseQuestionnaire(rdv.getQuestionnaireJson()));
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
