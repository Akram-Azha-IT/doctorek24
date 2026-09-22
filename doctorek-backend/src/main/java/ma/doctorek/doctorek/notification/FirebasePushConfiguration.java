package ma.doctorek.doctorek.notification;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.io.IOException;

@Configuration
public class FirebasePushConfiguration {
    @Bean
    @ConditionalOnProperty(name = "doctorek.push.fcm-enabled", havingValue = "true")
    FirebaseApp firebaseApp() throws IOException {
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.getApplicationDefault())
                .build();
        return FirebaseApp.initializeApp(options);
    }

    @Bean
    @ConditionalOnProperty(name = "doctorek.push.fcm-enabled", havingValue = "true")
    FirebaseMessaging firebaseMessaging(FirebaseApp app) { return FirebaseMessaging.getInstance(app); }
}
