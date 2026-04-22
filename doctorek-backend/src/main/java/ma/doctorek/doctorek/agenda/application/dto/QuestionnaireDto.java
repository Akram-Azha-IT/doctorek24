package ma.doctorek.doctorek.agenda.application.dto;

public record QuestionnaireDto(
    String  motif,
    boolean premierConsultation,
    Integer intensiteDouleur,
    String  dureeSymptoomes,
    String  notesComplementaires
) {}
