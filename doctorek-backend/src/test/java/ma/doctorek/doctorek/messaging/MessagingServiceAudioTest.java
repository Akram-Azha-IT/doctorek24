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
import ma.doctorek.doctorek.service.RateLimiterService;
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

import java.util.NoSuchElementException;
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
    @Mock RateLimiterService     rateLimiter;

    MessagingService service;

    UUID medecinId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    UUID convId    = UUID.randomUUID();
    ConversationEntity conv;

    @BeforeEach
    void setUp() {
        service = new MessagingService(conversationRepo, messageRepo, userRepo,
                stompTemplate, notifService, storageService, rateLimiter);
        conv = new ConversationEntity(medecinId, patientId);
        lenient().when(conversationRepo.findById(convId)).thenReturn(Optional.of(conv));
        User recipient = mock(User.class);
        lenient().when(recipient.getEmail()).thenReturn("dest@x.ma");
        User sender = mock(User.class);
        lenient().when(sender.getFirstName()).thenReturn("Ali");
        lenient().when(sender.getLastName()).thenReturn("Ben");
        lenient().when(userRepo.findById(medecinId)).thenReturn(Optional.of(recipient));
        lenient().when(userRepo.findById(patientId)).thenReturn(Optional.of(sender));
        // Pour les méthodes qui reconstruisent une ConversationResponse (toResponse).
        lenient().when(messageRepo.findByConversationIdOrderBySentAtDesc(any(), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());
        lenient().when(messageRepo.countUnread(any(), any())).thenReturn(0L);
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
        assertThat(resp.mediaUrl()).contains("/media");
        assertThat(resp.content()).isNull();

        ArgumentCaptor<String> keyCap = ArgumentCaptor.forClass(String.class);
        verify(storageService).upload(keyCap.capture(), any());
        assertThat(keyCap.getValue()).startsWith("messaging/" + convId + "/");
        verify(stompTemplate).convertAndSendToUser(eq("dest@x.ma"), eq("/queue/messages"), any());
    }

    @Test
    @DisplayName("rejette une durée > 120 s")
    void sendAudio_tooLong_rejected() {
        var f = audio(1024, "audio/webm");
        assertThatThrownBy(() -> service.sendAudioMessage(patientId, convId, f, 121, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Durée");
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("rejette un mime non-audio")
    void sendAudio_badMime_rejected() {
        var f = audio(1024, "application/zip");
        assertThatThrownBy(() -> service.sendAudioMessage(patientId, convId, f, 10, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("non autorisé");
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("rejette un fichier > 6 Mo")
    void sendAudio_tooBig_rejected() {
        var f = audio(7L * 1024 * 1024, "audio/webm");
        assertThatThrownBy(() -> service.sendAudioMessage(patientId, convId, f, 10, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("volumineux");
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("refuse un non-participant (SecurityException)")
    void sendAudio_notParticipant_denied() {
        UUID intrus = UUID.randomUUID();
        var f = audio(1024, "audio/webm");
        assertThatThrownBy(() -> service.sendAudioMessage(intrus, convId, f, 10, null))
                .isInstanceOf(SecurityException.class);
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("envoie un message texte et le diffuse")
    void sendText_valid_dispatches() {
        when(messageRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var req = new ma.doctorek.doctorek.messaging.dto.SendMessageRequest(convId, "Bonjour", "ct-1");

        var resp = service.sendMessage(patientId, req);

        assertThat(resp.messageType()).isEqualTo(ma.doctorek.doctorek.enums.MessageType.TEXT);
        assertThat(resp.content()).isEqualTo("Bonjour");
        assertThat(resp.mediaUrl()).isNull();
        verify(stompTemplate).convertAndSendToUser(eq("dest@x.ma"), eq("/queue/messages"), any());
    }

    @Test
    @DisplayName("idempotence : un clientMsgId déjà stocké renvoie l'existant sans réécrire")
    void sendText_duplicateClientMsgId_returnsExisting() {
        MessageEntity existing = MessageEntity.text(convId, patientId, "déjà là");
        when(messageRepo.findByClientMsgId("dup")).thenReturn(Optional.of(existing));
        var req = new ma.doctorek.doctorek.messaging.dto.SendMessageRequest(convId, "rejoué", "dup");

        var resp = service.sendMessage(patientId, req);

        assertThat(resp.content()).isEqualTo("déjà là");
        verify(messageRepo, never()).save(any());
    }

    // ---- Feature : droit de réponse patient ----

    @Test
    @DisplayName("patient bloqué quand le médecin a désactivé les réponses")
    void sendText_patientReplyDisabled_denied() {
        conv.setPatientCanReply(false);
        var req = new ma.doctorek.doctorek.messaging.dto.SendMessageRequest(convId, "coucou", null);
        assertThatThrownBy(() -> service.sendMessage(patientId, req))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("désactivé");
        verify(messageRepo, never()).save(any());
    }

    @Test
    @DisplayName("médecin peut toujours écrire même réponses désactivées")
    void sendText_medecinAlwaysAllowed() {
        conv.setPatientCanReply(false);
        when(messageRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var req = new ma.doctorek.doctorek.messaging.dto.SendMessageRequest(convId, "bonjour", null);
        var resp = service.sendMessage(medecinId, req);
        assertThat(resp.content()).isEqualTo("bonjour");
    }

    @Test
    @DisplayName("setPatientCanReply : seul le médecin de la conversation peut modifier")
    void setPatientCanReply_nonMedecin_denied() {
        assertThatThrownBy(() -> service.setPatientCanReply(convId, patientId, false))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    @DisplayName("setPatientCanReply bascule le flag")
    void setPatientCanReply_toggles() {
        service.setPatientCanReply(convId, medecinId, false);
        assertThat(conv.isPatientCanReply()).isFalse();
        verify(conversationRepo).save(conv);
    }

    // ---- Anti-flood ----

    @Test
    @DisplayName("texte : rejette un message trop long (> 5000 caractères)")
    void sendText_tooLong_rejected() {
        String big = "x".repeat(5001);
        var req = new ma.doctorek.doctorek.messaging.dto.SendMessageRequest(convId, big, null);
        assertThatThrownBy(() -> service.sendMessage(patientId, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("trop long");
        verify(messageRepo, never()).save(any());
    }

    @Test
    @DisplayName("rate limit : un 429 du limiteur remonte et bloque l'envoi")
    void sendText_rateLimited_propagates() {
        doThrow(new ma.doctorek.doctorek.exception.RateLimitExceededException("stop"))
                .when(rateLimiter).checkAndIncrement(eq("msg"), any(), anyInt(), any());
        var req = new ma.doctorek.doctorek.messaging.dto.SendMessageRequest(convId, "hi", null);
        assertThatThrownBy(() -> service.sendMessage(patientId, req))
                .isInstanceOf(ma.doctorek.doctorek.exception.RateLimitExceededException.class);
        verify(messageRepo, never()).save(any());
    }

    @Test
    @DisplayName("quota : rejette au-delà du nombre max de fichiers par conversation")
    void sendDocument_fileCountExceeded_rejected() {
        when(messageRepo.countMediaByConversation(convId)).thenReturn(50L);
        var f = new MockMultipartFile("file", "a.pdf", "application/pdf", new byte[10]);
        assertThatThrownBy(() -> service.sendDocumentMessage(patientId, convId, f, null))
                .isInstanceOf(ma.doctorek.doctorek.exception.RateLimitExceededException.class)
                .hasMessageContaining("Limite de pièces jointes");
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("quota : rejette au-delà du volume cumulé par conversation")
    void sendDocument_bytesExceeded_rejected() {
        when(messageRepo.countMediaByConversation(convId)).thenReturn(1L);
        when(messageRepo.sumMediaSizeByConversation(convId)).thenReturn(200L * 1024 * 1024);
        var f = new MockMultipartFile("file", "a.pdf", "application/pdf", new byte[1024]);
        assertThatThrownBy(() -> service.sendDocumentMessage(patientId, convId, f, null))
                .isInstanceOf(ma.doctorek.doctorek.exception.RateLimitExceededException.class)
                .hasMessageContaining("saturé");
        verifyNoInteractions(storageService);
    }

    // ---- Feature : pièces jointes ----

    @Test
    @DisplayName("stocke un PDF et crée un message DOCUMENT")
    void sendDocument_validPdf_stores() {
        when(messageRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var f = new MockMultipartFile("file", "analyse.pdf", "application/pdf", new byte[2048]);
        var resp = service.sendDocumentMessage(patientId, convId, f, "cd-1");
        assertThat(resp.messageType()).isEqualTo(MessageType.DOCUMENT);
        assertThat(resp.mediaFilename()).isEqualTo("analyse.pdf");
        assertThat(resp.mediaSize()).isEqualTo(2048L);
        assertThat(resp.mediaUrl()).contains("/media");
    }

    @Test
    @DisplayName("rejette un type de fichier non autorisé")
    void sendDocument_badMime_rejected() {
        var f = new MockMultipartFile("file", "virus.exe", "application/x-msdownload", new byte[10]);
        assertThatThrownBy(() -> service.sendDocumentMessage(patientId, convId, f, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("non autorisé");
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("nettoie le chemin dans le nom de fichier")
    void sendDocument_pathTraversalFilename_sanitized() {
        when(messageRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        var f = new MockMultipartFile("file", "../../etc/passwd.png", "image/png", new byte[64]);
        var resp = service.sendDocumentMessage(medecinId, convId, f, null);
        assertThat(resp.mediaFilename()).isEqualTo("passwd.png");
    }

    @Test
    @DisplayName("rejette un fichier vide")
    void sendAudio_empty_rejected() {
        var empty = new MockMultipartFile("file", "voice.webm", "audio/webm", new byte[0]);
        assertThatThrownBy(() -> service.sendAudioMessage(patientId, convId, empty, 10, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vide");
    }

    @Test
    @DisplayName("échec du stockage MinIO → IllegalStateException")
    void sendAudio_storageFails_throws() throws Exception {
        doThrow(new java.io.IOException("minio down")).when(storageService).upload(anyString(), any());
        var f = audio(1024, "audio/webm");
        assertThatThrownBy(() -> service.sendAudioMessage(patientId, convId, f, 10, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("stockage");
    }

    @Test
    @DisplayName("course clientMsgId : save en conflit → renvoie le gagnant")
    void sendText_saveConflict_returnsWinner() {
        MessageEntity winner = MessageEntity.text(convId, patientId, "gagnant");
        when(messageRepo.findByClientMsgId("race"))
                .thenReturn(Optional.empty())          // 1er appel : idempotence
                .thenReturn(Optional.of(winner));       // 2e appel : après conflit
        when(messageRepo.save(any()))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("dup"));
        var req = new ma.doctorek.doctorek.messaging.dto.SendMessageRequest(convId, "perdu", "race");

        var resp = service.sendMessage(patientId, req);

        assertThat(resp.content()).isEqualTo("gagnant");
    }

    @Test
    @DisplayName("getAudio sur un message TEXT → introuvable")
    void getAudio_onTextMessage_notFound() {
        UUID msgId = UUID.randomUUID();
        MessageEntity text = MessageEntity.text(convId, patientId, "coucou");
        when(messageRepo.findById(msgId)).thenReturn(Optional.of(text));
        assertThatThrownBy(() -> service.getMedia(msgId, patientId))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("getAudio renvoie le flux pour un participant")
    void getAudio_participant_returnsStream() throws Exception {
        UUID msgId = UUID.randomUUID();
        MessageEntity msg = MessageEntity.audio(convId, patientId, "messaging/k", 10, "audio/webm");
        when(messageRepo.findById(msgId)).thenReturn(Optional.of(msg));
        Resource res = mock(Resource.class);
        when(storageService.download("messaging/k")).thenReturn(res);

        var stream = service.getMedia(msgId, medecinId);

        assertThat(stream.mime()).isEqualTo("audio/webm");
        assertThat(stream.resource()).isSameAs(res);
    }

    @Test
    @DisplayName("getAudio refuse un non-participant")
    void getAudio_notParticipant_denied() {
        UUID msgId = UUID.randomUUID();
        MessageEntity msg = MessageEntity.audio(convId, patientId, "messaging/k", 10, "audio/webm");
        when(messageRepo.findById(msgId)).thenReturn(Optional.of(msg));

        UUID intrus = UUID.randomUUID();
        assertThatThrownBy(() -> service.getMedia(msgId, intrus))
                .isInstanceOf(SecurityException.class);
        verifyNoInteractions(storageService);
    }
}
