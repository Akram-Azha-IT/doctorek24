package ma.doctorek.doctorek.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "google.wallet")
public class GoogleWalletProperties {

    private boolean enabled;
    private String issuerId;
    private String classId;
    private String serviceAccountPath;
    private String heroSecret;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getIssuerId() {
        return issuerId;
    }

    public void setIssuerId(String issuerId) {
        this.issuerId = issuerId;
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getServiceAccountPath() {
        return serviceAccountPath;
    }

    public void setServiceAccountPath(String serviceAccountPath) {
        this.serviceAccountPath = serviceAccountPath;
    }

    public String getHeroSecret() {
        return heroSecret;
    }

    public void setHeroSecret(String heroSecret) {
        this.heroSecret = heroSecret;
    }
}
