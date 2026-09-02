package ma.doctorek.doctorek.agent;

import ma.doctorek.doctorek.agent.dto.AgentTranscriptionResponse;
import ma.doctorek.doctorek.exception.AgentFournisseurException;
import ma.doctorek.doctorek.exception.AgentIndisponibleException;
import ma.doctorek.doctorek.service.RateLimiterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Semaphore;

/** Valide l'audio court puis délègue sa transcription à Gemini. */
@Service
public class AgentTranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(AgentTranscriptionService.class);
    private static final String ACTION_QUOTA = "agent-transcription";
    private static final int LONGUEUR_MAX_TRANSCRIPTION = 500;
    private static final Set<String> MIME_TYPES = Set.of(
            "audio/webm", "video/webm", "audio/wav", "audio/x-wav",
            "audio/mpeg", "audio/mp4", "audio/m4a", "audio/ogg");

    private final AgentTranscriptionClient client;
    private final AgentTranscriptionProperties properties;
    private final RateLimiterService rateLimiter;
    private final Semaphore appelsSimultanes;

    public AgentTranscriptionService(AgentTranscriptionClient client,
                                     AgentTranscriptionProperties properties,
                                     RateLimiterService rateLimiter) {
        this.client = client;
        this.properties = properties;
        this.rateLimiter = rateLimiter;
        this.appelsSimultanes = new Semaphore(Math.max(1, properties.getMaxConcurrent()));
    }

    public boolean estDisponible() {
        return properties.isEnabled()
                && properties.getApiKey() != null
                && !properties.getApiKey().isBlank();
    }

    public AgentTranscriptionResponse transcrire(UUID patientId,
                                                  MultipartFile audio,
                                                  double dureeSecondes) {
        if (!estDisponible()) {
            throw new AgentIndisponibleException();
        }
        valider(audio, dureeSecondes);
        rateLimiter.checkAndIncrement(ACTION_QUOTA, patientId,
                properties.getQuotaRequests(), properties.getQuotaWindow());
        if (!appelsSimultanes.tryAcquire()) {
            throw new AgentIndisponibleException();
        }

        long debut = System.currentTimeMillis();
        try {
            String mimeType = mimeType(audio);
            log.info("agent_transcription_requete taille={} mime={} dureeSecondes={}",
                    audio.getSize(), mimeType, dureeSecondes);
            String transcription = client.transcrire(audio.getBytes(), mimeType);
            String bornee = transcription.length() <= LONGUEUR_MAX_TRANSCRIPTION
                    ? transcription
                    : transcription.substring(0, LONGUEUR_MAX_TRANSCRIPTION);
            log.info("agent_transcription taille={} dureeMs={}",
                    audio.getSize(), System.currentTimeMillis() - debut);
            return new AgentTranscriptionResponse(bornee);
        } catch (IOException | RuntimeException exception) {
            log.error("agent_transcription_fournisseur_echec type={}",
                    exception.getClass().getSimpleName());
            throw new AgentFournisseurException(exception);
        } finally {
            appelsSimultanes.release();
        }
    }

    private void valider(MultipartFile audio, double dureeSecondes) {
        if (audio == null || audio.isEmpty()) {
            throw new IllegalArgumentException("Le fichier audio est vide.");
        }
        if (audio.getSize() > properties.getMaxBytes()) {
            throw new IllegalArgumentException("Le fichier audio est trop volumineux.");
        }
        if (!MIME_TYPES.contains(mimeType(audio))) {
            throw new IllegalArgumentException("Ce format audio n'est pas autorisé.");
        }
        if (!Double.isFinite(dureeSecondes)
                || dureeSecondes <= 0
                || dureeSecondes > properties.getMaxDurationSeconds()) {
            throw new IllegalArgumentException("La dictée est limitée à 30 secondes.");
        }
    }

    private static String mimeType(MultipartFile audio) {
        String type = audio.getContentType();
        if (type == null) return "";
        return type.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
    }
}
