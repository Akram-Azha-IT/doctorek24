package ma.doctorek.doctorek.agent;

/** Port vers le fournisseur speech-to-text. */
public interface AgentTranscriptionClient {
    String transcrire(byte[] audio, String mimeType);
}
