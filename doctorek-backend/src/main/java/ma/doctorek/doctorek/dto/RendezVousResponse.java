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
        /** Renseigné seulement quand un tiers a réservé (titulaire pour un proche, ou médecin). */
        String creeParNom,
        QuestionnaireDto questionnaire) {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static RendezVousResponse from(RendezVousEntity rdv) {
        return from(rdv, null, null, null);
    }

    public static RendezVousResponse from(RendezVousEntity rdv, String patientPrenom, String patientNom) {
        return from(rdv, patientPrenom, patientNom, null);
    }

    public static RendezVousResponse from(RendezVousEntity rdv, String patientPrenom, String patientNom,
                                           String creeParNom) {
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
                creeParNom,
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
