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
            PushPreview preview = previewFor(type);
            Message message = Message.builder()
                    .setToken(cipher.decrypt(installation.getTokenCiphertext()))
                    .setNotification(Notification.builder().setTitle(preview.title())
                            .setBody(preview.body()).build())
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

    /**
     * Aperçu transmis à Firebase et potentiellement visible sur un écran verrouillé.
     * Il décrit l'événement sans nom, date, contenu de message ni donnée médicale.
     */
    static PushPreview previewFor(String type) {
        return switch (type == null ? "" : type) {
            case "MESSAGE_RECU" -> new PushPreview(
                    "Nouveau message",
                    "Un nouveau message vous attend dans votre espace sécurisé.");
            case "RDV_ANNULE_PATIENT", "RDV_ANNULE_MEDECIN" -> new PushPreview(
                    "Rendez-vous annulé",
                    "Consultez votre agenda Doctorek pour les détails.");
            case "RDV_CREE_MEDECIN", "RDV_PRIS_PATIENT", "RDV_RATTACHE" -> new PushPreview(
                    "Rendez-vous mis à jour",
                    "Une mise à jour est disponible dans votre agenda Doctorek.");
            case "RDV_RAPPEL" -> new PushPreview(
                    "Rappel de rendez-vous",
                    "Un rendez-vous approche. Ouvrez Doctorek pour les détails.");
            case "CARTE_CREEE" -> new PushPreview(
                    "Votre carte est prête",
                    "Votre carte Doctorek est maintenant disponible.");
            case "DOCUMENTS_REQUIS" -> new PushPreview(
                    "Documents à préparer",
                    "Une action vous attend avant votre rendez-vous.");
            case "DOCUMENT_FOURNI" -> new PushPreview(
                    "Document reçu",
                    "Un document a été ajouté à un rendez-vous.");
            case "PLACE_LIBEREE" -> new PushPreview(
                    "Un créneau est disponible",
                    "Ouvrez Doctorek pour consulter cette disponibilité.");
            case "ANNIVERSAIRE" -> new PushPreview(
                    "Une attention vous attend",
                    "Ouvrez Doctorek pour la découvrir.");
            default -> new PushPreview(
                    "Nouvelle activité",
                    "Une nouvelle activité est disponible dans votre espace sécurisé.");
        };
    }

    record PushPreview(String title, String body) {}
}
