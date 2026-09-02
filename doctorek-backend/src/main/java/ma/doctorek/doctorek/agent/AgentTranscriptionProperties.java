package ma.doctorek.doctorek.agent;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/** Configuration du speech-to-text Gemini utilisé par le composeur de l'agent. */
@Component
@Validated
@ConfigurationProperties(prefix = "doctorek.agent.transcription")
public class AgentTranscriptionProperties {

    private boolean enabled;
    private String apiKey = "";
    private String model = "gemini-3.5-transcribe";
    @Min(1)
    private long maxBytes = 2L * 1024 * 1024;
    @DecimalMin("0.1")
    @DecimalMax("60")
    private double maxDurationSeconds = 30.5;
    @Min(1)
    @Max(8)
    private int maxConcurrent = 2;
    @Min(1)
    private int quotaRequests = 10;
    @NotNull
    private Duration quotaWindow = Duration.ofMinutes(5);
    @NotNull
    private Duration connectTimeout = Duration.ofSeconds(5);
    @NotNull
    private Duration readTimeout = Duration.ofSeconds(45);
    @Size(max = 100)
    private List<String> customVocabulary = new ArrayList<>(List.of(
            "Doctorek", "Casablanca", "Casa", "Rabat", "Marrakech", "Mohammedia",
            "dentiste", "cardiologue", "dermatologue", "gynécologue", "pédiatre",
            "disponible", "rendez-vous", "lyoma", "ghada", "بغيت", "اليوم", "غدا"));

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public long getMaxBytes() { return maxBytes; }
    public void setMaxBytes(long maxBytes) { this.maxBytes = maxBytes; }
    public double getMaxDurationSeconds() { return maxDurationSeconds; }
    public void setMaxDurationSeconds(double maxDurationSeconds) { this.maxDurationSeconds = maxDurationSeconds; }
    public int getMaxConcurrent() { return maxConcurrent; }
    public void setMaxConcurrent(int maxConcurrent) { this.maxConcurrent = maxConcurrent; }
    public int getQuotaRequests() { return quotaRequests; }
    public void setQuotaRequests(int quotaRequests) { this.quotaRequests = quotaRequests; }
    public Duration getQuotaWindow() { return quotaWindow; }
    public void setQuotaWindow(Duration quotaWindow) { this.quotaWindow = quotaWindow; }
    public Duration getConnectTimeout() { return connectTimeout; }
    public void setConnectTimeout(Duration connectTimeout) { this.connectTimeout = connectTimeout; }
    public Duration getReadTimeout() { return readTimeout; }
    public void setReadTimeout(Duration readTimeout) { this.readTimeout = readTimeout; }
    public List<String> getCustomVocabulary() { return customVocabulary; }
    public void setCustomVocabulary(List<String> customVocabulary) {
        this.customVocabulary = customVocabulary == null ? new ArrayList<>() : new ArrayList<>(customVocabulary);
    }
}
