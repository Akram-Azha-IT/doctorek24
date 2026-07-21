package ma.doctorek.doctorek.messaging;

import ma.doctorek.doctorek.entity.ConversationEntity;
import ma.doctorek.doctorek.entity.MessageEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.MessageType;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.ConversationRepository;
import ma.doctorek.doctorek.repository.MessageRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.MinioStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessagingServiceAudioTest {

    @Mock ConversationRepository conversationRepo;
    @Mock MessageRepository      messageRepo;
    @Mock UserRepository         userRepo;
    @Mock SimpMessagingTemplate  stompTemplate;
    @Mock NotificationService    notifService;
    @Mock MinioStorageService    storageService;

    MessagingService service;

    UUID medecinId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    UUID convId    = UUID.randomUUID();
    ConversationEntity conv;

    @BeforeEach
    void setUp() {
        service = new MessagingService(conversationRepo, messageRepo, userRepo,
                stompTemplate, notifService, storageService);
        conv = new ConversationEntity(medecinId, patientId);
        lenient().when(conversationRepo.findById(convId)).thenReturn(Optional.of(conv));
        User recipient = mock(User.class);
        lenient().when(recipient.getEmail()).thenReturn("dest@x.ma");
        User sender = mock(User.class);
        lenient().when(sender.getFirstName()).thenReturn("Ali");
        lenient().when(sender.getLastName()).thenReturn("Ben");
        lenient().when(userRepo.findById(medecinId)).thenReturn(Optional.of(recipient));
        lenient().when(userRepo.findById(patientId)).thenReturn(Optional.of(sender));
    }

    private MockMultipartFile audio(long sizeBytes, String mime) {
        byte[] data = new byte[(int) sizeBytes];
        return new MockMultipartFile("file", "voice.webm", mime, data);
    }

    @Test
    @DisplayName("stocke dans MinIO et crée un message AUDIO valide")
    void sendAudio_valid_storesAndDispatches() throws Exception {
        when(messageRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        var resp = service.sendAudioMessage(patientId, convId, audio(1024, "audio/webm"), 12, "cid-1");

        assertThat(resp.messageType()).isEqualTo(MessageType.AUDIO);
        assertThat(resp.mediaDurationSec()).isEqualTo(12);
        assertThat(resp.mediaUrl()).contains("/audio");
        assertThat(resp.content()).isNull();

        ArgumentCaptor<String> keyCap = ArgumentCaptor.forClass(String.class);
        verify(storageService).upload(keyCap.capture(), any());
        assertThat(keyCap.getValue()).startsWith("messaging/" + convId + "/");
        verify(stompTemplate).convertAndSendToUser(eq("dest@x.ma"), eq("/queue/messages"), any());
    }

    @Test
    @DisplayName("rejette une durée > 120 s")
    void sendAudio_tooLong_rejected() {
        assertThatThrownBy(() ->
                service.sendAudioMessage(patientId, convId, audio(1024, "audio/webm"), 121, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Durée");
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("rejette un mime non-audio")
    void sendAudio_badMime_rejected() {
        assertThatThrownBy(() ->
                service.sendAudioMessage(patientId, convId, audio(1024, "application/zip"), 10, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("non autorisé");
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("rejette un fichier > 6 Mo")
    void sendAudio_tooBig_rejected() {
        assertThatThrownBy(() ->
                service.sendAudioMessage(patientId, convId, audio(7L * 1024 * 1024, "audio/webm"), 10, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("volumineux");
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("refuse un non-participant (SecurityException)")
    void sendAudio_notParticipant_denied() {
        UUID intrus = UUID.randomUUID();
        assertThatThrownBy(() ->
                service.sendAudioMessage(intrus, convId, audio(1024, "audio/webm"), 10, null))
                .isInstanceOf(SecurityException.class);
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("getAudio renvoie le flux pour un participant")
    void getAudio_participant_returnsStream() throws Exception {
        UUID msgId = UUID.randomUUID();
        MessageEntity msg = MessageEntity.audio(convId, patientId, "messaging/k", 10, "audio/webm");
        when(messageRepo.findById(msgId)).thenReturn(Optional.of(msg));
        Resource res = mock(Resource.class);
        when(storageService.download("messaging/k")).thenReturn(res);

        var stream = service.getAudio(msgId, medecinId);

        assertThat(stream.mime()).isEqualTo("audio/webm");
        assertThat(stream.resource()).isSameAs(res);
    }

    @Test
    @DisplayName("getAudio refuse un non-participant")
    void getAudio_notParticipant_denied() throws Exception {
        UUID msgId = UUID.randomUUID();
        MessageEntity msg = MessageEntity.audio(convId, patientId, "messaging/k", 10, "audio/webm");
        when(messageRepo.findById(msgId)).thenReturn(Optional.of(msg));

        UUID intrus = UUID.randomUUID();
        assertThatThrownBy(() -> service.getAudio(msgId, intrus))
                .isInstanceOf(SecurityException.class);
        verifyNoInteractions(storageService);
    }
}
