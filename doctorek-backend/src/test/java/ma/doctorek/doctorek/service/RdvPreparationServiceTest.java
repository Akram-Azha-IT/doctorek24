package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.DocumentRequisResponse;
import ma.doctorek.doctorek.entity.RdvDocumentRequisEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.RendezVousNotFoundException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.RdvDocumentRequisRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RdvPreparationServiceTest {

    @Mock private RdvDocumentRequisRepository docRepo;
    @Mock private RendezVousRepository rdvRepo;
    @Mock private UserRepository userRepo;
    @Mock private NotificationService notificationService;

    private RdvPreparationService service;

    private final UUID rdvId = UUID.randomUUID();
    private final UUID medecinId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new RdvPreparationService(docRepo, rdvRepo, userRepo, notificationService);
    }

    private RendezVousEntity rdv() {
        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setId(rdvId);
        rdv.setMedecinId(medecinId);
        rdv.setPatientId(patientId);
        rdv.setDateRdv(LocalDate.of(2026, 7, 15));
        return rdv;
    }

    @Test
    @DisplayName("add crée les documents demandés et notifie le patient")
    void add_createsDocumentsAndNotifiesPatient() {
        when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdv()));
        when(docRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        User medecin = User.builder().firstName("Sara").lastName("Amrani").build();
        when(userRepo.findById(medecinId)).thenReturn(Optional.of(medecin));

        List<DocumentRequisResponse> result =
            service.add(rdvId, List.of("Carte CNSS", "  Analyses sanguines  ", "  "));

        assertThat(result).hasSize(2);
        assertThat(result).extracting(DocumentRequisResponse::libelle)
            .containsExactly("Carte CNSS", "Analyses sanguines");
        verify(notificationService).push(eq(patientId), eq("DOCUMENTS_REQUIS"), anyString(), anyString());
    }

    @Test
    @DisplayName("add sans libellé valide ne notifie pas")
    void add_withOnlyBlankLabels_doesNotNotify() {
        when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdv()));

        List<DocumentRequisResponse> result = service.add(rdvId, List.of("   "));

        assertThat(result).isEmpty();
        verify(notificationService, never()).push(any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("add sur un RDV inexistant lève RendezVousNotFoundException")
    void add_missingRdv_throws() {
        when(rdvRepo.findById(rdvId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.add(rdvId, List.of("Carte CNSS")))
            .isInstanceOf(RendezVousNotFoundException.class);
    }

    @Test
    @DisplayName("marquerFourni bascule le statut du document")
    void marquerFourni_togglesFlag() {
        RdvDocumentRequisEntity doc = new RdvDocumentRequisEntity();
        doc.setId(UUID.randomUUID());
        doc.setRdvId(rdvId);
        doc.setLibelle("Carte CNSS");
        when(docRepo.findByIdAndRdvId(doc.getId(), rdvId)).thenReturn(Optional.of(doc));
        when(docRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DocumentRequisResponse result = service.marquerFourni(rdvId, doc.getId(), true);

        assertThat(result.fourni()).isTrue();
    }

    @Test
    @DisplayName("marquerFourni notifie le médecin quand le patient coche un document")
    void marquerFourni_checked_notifiesMedecin() {
        RdvDocumentRequisEntity doc = new RdvDocumentRequisEntity();
        doc.setId(UUID.randomUUID());
        doc.setRdvId(rdvId);
        doc.setLibelle("Carte CNSS");
        when(docRepo.findByIdAndRdvId(doc.getId(), rdvId)).thenReturn(Optional.of(doc));
        when(docRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(docRepo.findByRdvIdOrderByCreatedAtAsc(rdvId)).thenReturn(List.of(doc));
        when(rdvRepo.findById(rdvId)).thenReturn(Optional.of(rdv()));
        User patient = User.builder().firstName("Yassine").lastName("Berrada").build();
        when(userRepo.findById(patientId)).thenReturn(Optional.of(patient));

        service.marquerFourni(rdvId, doc.getId(), true);

        verify(notificationService).push(eq(medecinId), eq("DOCUMENT_FOURNI"),
            eq("Yassine Berrada a préparé « Carte CNSS »"), anyString());
    }

    @Test
    @DisplayName("marquerFourni décoché ne notifie pas")
    void marquerFourni_unchecked_doesNotNotify() {
        RdvDocumentRequisEntity doc = new RdvDocumentRequisEntity();
        doc.setId(UUID.randomUUID());
        doc.setRdvId(rdvId);
        doc.setLibelle("Carte CNSS");
        doc.setFourni(true);
        when(docRepo.findByIdAndRdvId(doc.getId(), rdvId)).thenReturn(Optional.of(doc));
        when(docRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.marquerFourni(rdvId, doc.getId(), false);

        verify(notificationService, never()).push(any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("remove sur un document inconnu lève IllegalArgumentException")
    void remove_unknownDoc_throws() {
        UUID docId = UUID.randomUUID();
        when(docRepo.findByIdAndRdvId(docId, rdvId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.remove(rdvId, docId))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
