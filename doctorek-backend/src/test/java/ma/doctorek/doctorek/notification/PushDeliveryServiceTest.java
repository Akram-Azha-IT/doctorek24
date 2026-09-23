package ma.doctorek.doctorek.notification;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PushDeliveryServiceTest {

    @Test
    void messagePreviewIsUsefulWithoutExposingSenderOrContent() {
        var preview = PushDeliveryService.previewFor("MESSAGE_RECU");

        assertThat(preview.title()).isEqualTo("Nouveau message");
        assertThat(preview.body()).isEqualTo(
                "Un nouveau message vous attend dans votre espace sécurisé.");
    }

    @Test
    void appointmentEventsHaveContextualPreviews() {
        assertThat(PushDeliveryService.previewFor("RDV_ANNULE_MEDECIN").title())
                .isEqualTo("Rendez-vous annulé");
        assertThat(PushDeliveryService.previewFor("RDV_RAPPEL").title())
                .isEqualTo("Rappel de rendez-vous");
        assertThat(PushDeliveryService.previewFor("RDV_CREE_MEDECIN").title())
                .isEqualTo("Rendez-vous mis à jour");
    }

    @Test
    void unknownOrMissingTypeUsesSafeFallback() {
        assertThat(PushDeliveryService.previewFor("TYPE_INCONNU"))
                .isEqualTo(PushDeliveryService.previewFor(null));
        assertThat(PushDeliveryService.previewFor(null).title())
                .isEqualTo("Nouvelle activité");
    }
}
