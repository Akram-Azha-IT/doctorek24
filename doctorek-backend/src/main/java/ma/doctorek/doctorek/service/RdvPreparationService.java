package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.DocumentRequisResponse;
import ma.doctorek.doctorek.entity.RdvDocumentRequisEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.exception.RendezVousNotFoundException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.RdvDocumentRequisRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Préparation des rendez-vous : le médecin liste les documents (médicaux ou
 * administratifs) que le patient doit apporter/fournir avant la consultation.
 */
@Service
public class RdvPreparationService {

    private final RdvDocumentRequisRepository docRepo;
    private final RendezVousRepository rdvRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;

    public RdvPreparationService(RdvDocumentRequisRepository docRepo,
                                  RendezVousRepository rdvRepo,
                                  UserRepository userRepo,
                                  NotificationService notificationService) {
        this.docRepo = docRepo;
        this.rdvRepo = rdvRepo;
        this.userRepo = userRepo;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<DocumentRequisResponse> list(UUID rdvId) {
        requireRdv(rdvId);
        return docRepo.findByRdvIdOrderByCreatedAtAsc(rdvId)
                .stream().map(DocumentRequisResponse::from).toList();
    }

    @Transactional
    public List<DocumentRequisResponse> add(UUID rdvId, List<String> libelles) {
        RendezVousEntity rdv = requireRdv(rdvId);

        List<RdvDocumentRequisEntity> saved = libelles.stream()
                .map(String::trim)
                .filter(l -> !l.isEmpty())
                .map(l -> {
                    RdvDocumentRequisEntity e = new RdvDocumentRequisEntity();
                    e.setRdvId(rdvId);
                    e.setLibelle(l);
                    return docRepo.save(e);
                })
                .toList();

        if (!saved.isEmpty()) {
            notifyPatient(rdv, saved.size());
        }
        return saved.stream().map(DocumentRequisResponse::from).toList();
    }

    @Transactional
    public void remove(UUID rdvId, UUID docId) {
        RdvDocumentRequisEntity doc = docRepo.findByIdAndRdvId(docId, rdvId)
                .orElseThrow(() -> new IllegalArgumentException("Document requis introuvable"));
        docRepo.delete(doc);
    }

    @Transactional
    public DocumentRequisResponse marquerFourni(UUID rdvId, UUID docId, boolean fourni) {
        RdvDocumentRequisEntity doc = docRepo.findByIdAndRdvId(docId, rdvId)
                .orElseThrow(() -> new IllegalArgumentException("Document requis introuvable"));
        boolean wasFourni = doc.isFourni();
        doc.setFourni(fourni);
        DocumentRequisResponse response = DocumentRequisResponse.from(docRepo.save(doc));

        if (fourni && !wasFourni) {
            notifyMedecinDocumentFourni(rdvId, doc.getLibelle());
        }
        return response;
    }

    private RendezVousEntity requireRdv(UUID rdvId) {
        return rdvRepo.findById(rdvId)
                .orElseThrow(() -> new RendezVousNotFoundException(rdvId));
    }

    private void notifyMedecinDocumentFourni(UUID rdvId, String libelle) {
        rdvRepo.findById(rdvId).ifPresent(rdv -> {
            List<RdvDocumentRequisEntity> all = docRepo.findByRdvIdOrderByCreatedAtAsc(rdvId);
            long fournis = all.stream().filter(RdvDocumentRequisEntity::isFourni).count();

            String patientNom = userRepo.findById(rdv.getPatientId())
                    .map(p -> p.getFirstName() + " " + p.getLastName())
                    .orElse("Le patient");

            String progression = fournis >= all.size()
                    ? "Tous les documents sont prêts pour le rendez-vous du " + rdv.getDateRdv() + "."
                    : fournis + "/" + all.size() + " documents prêts pour le rendez-vous du " + rdv.getDateRdv() + ".";

            notificationService.push(rdv.getMedecinId(), "DOCUMENT_FOURNI",
                    patientNom + " a préparé « " + libelle + " »", progression);
        });
    }

    private void notifyPatient(RendezVousEntity rdv, int count) {
        userRepo.findById(rdv.getMedecinId()).ifPresent(medecin -> {
            String medecinNom = "Dr. " + medecin.getFirstName() + " " + medecin.getLastName();
            String body = count == 1
                    ? medecinNom + " vous demande de préparer 1 document pour votre rendez-vous du " + rdv.getDateRdv() + "."
                    : medecinNom + " vous demande de préparer " + count + " documents pour votre rendez-vous du " + rdv.getDateRdv() + ".";
            notificationService.push(rdv.getPatientId(), "DOCUMENTS_REQUIS",
                    "Documents à préparer pour votre rendez-vous", body);
        });
    }
}
