package ma.doctorek.doctorek.notification;

import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.UUID;

@Service
public class PushDeliveryService {
    private static final Logger log = LoggerFactory.getLogger(PushDeliveryService.class);
    private final PushInstallationRepository repository;
    private final PushTokenCipher cipher;
    private final ObjectProvider<FirebaseMessaging> messaging;

    public PushDeliveryService(PushInstallationRepository repository, PushTokenCipher cipher,
                               ObjectProvider<FirebaseMessaging> messaging) {
        this.repository = repository; this.cipher = cipher; this.messaging = messaging;
    }

    public void deliverAfterCommit(UUID userId, UUID notificationId, String type) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { deliver(userId, notificationId, type); }
            });
        } else {
            deliver(userId, notificationId, type);
        }
    }

    private void deliver(UUID userId, UUID notificationId, String type) {
        FirebaseMessaging client = messaging.getIfAvailable();
        if (client == null) return;
        repository.findByUserIdAndEnabledTrue(userId).stream()
                .filter(value -> "ANDROID".equals(value.getPlatform()))
                .forEach(value -> send(client, value, notificationId, type));
    }

    private void send(FirebaseMessaging client, PushInstallationEntity installation, UUID notificationId, String type) {
        try {
            Message message = Message.builder()
                    .setToken(cipher.decrypt(installation.getTokenCiphertext()))
                    .setNotification(Notification.builder().setTitle("Doctorek")
                            .setBody("Une nouvelle activité est disponible dans votre espace.").build())
                    .putData("notificationId", notificationId.toString())
                    .putData("type", type)
                    .setAndroidConfig(AndroidConfig.builder().setPriority(AndroidConfig.Priority.HIGH)
                            .setTtl(15 * 60 * 1000L)
                            .setNotification(AndroidNotification.builder().setChannelId("default").build()).build())
                    .build();
            client.send(message);
        } catch (FirebaseMessagingException exception) {
            if (exception.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                installation.setEnabled(false); repository.save(installation);
            }
            log.warn("Échec d'envoi d'une notification mobile (code={})", exception.getMessagingErrorCode());
        } catch (RuntimeException exception) {
            log.warn("Échec d'envoi d'une notification mobile");
        }
    }
}
