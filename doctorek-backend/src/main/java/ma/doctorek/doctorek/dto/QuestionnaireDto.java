package ma.doctorek.doctorek.dto;

public record QuestionnaireDto(
        String motif,
        boolean premierConsultation,
        Integer intensiteDouleur,
        String dureeSymptoomes,
        String notesComplementaires) {}
