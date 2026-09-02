package ma.doctorek.doctorek.agent.dto;

/** Texte dicté par le patient, à relire avant envoi au chat. */
public record AgentTranscriptionResponse(String transcription) {
}
