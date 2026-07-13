package ma.doctorek.doctorek.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.dto.CreateOrdonnanceRequest;
import ma.doctorek.doctorek.dto.DocumentMedicalResponse;
import ma.doctorek.doctorek.dto.InfosMedicalesResponse;
import ma.doctorek.doctorek.dto.MedicamentDto;
import ma.doctorek.doctorek.dto.OrdonnanceResponse;
import ma.doctorek.doctorek.dto.UpsertInfosMedicalesRequest;
import ma.doctorek.doctorek.entity.DocumentMedicalEntity;
import ma.doctorek.doctorek.entity.InfosMedicalesEntity;
import ma.doctorek.doctorek.entity.OrdonnanceEntity;
import ma.doctorek.doctorek.repository.DocumentMedicalRepository;
import ma.doctorek.doctorek.repository.InfosMedicalesRepository;
import ma.doctorek.doctorek.repository.OrdonnanceRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DossierService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final InfosMedicalesRepository infosRepo;
    private final OrdonnanceRepository ordonnanceRepo;
    private final DocumentMedicalRepository documentRepo;
    private final MinioStorageService storageService;

    public DossierService(InfosMedicalesRepository infosRepo,
                           OrdonnanceRepository ordonnanceRepo,
                           DocumentMedicalRepository documentRepo,
                           MinioStorageService storageService) {
        this.infosRepo      = infosRepo;
        this.ordonnanceRepo = ordonnanceRepo;
        this.documentRepo   = documentRepo;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public InfosMedicalesResponse getInfos(UUID patientId) {
        return infosRepo.findById(patientId)
            .map(InfosMedicalesResponse::from)
            .orElseGet(() -> InfosMedicalesResponse.empty(patientId));
    }

    @Transactional
    public InfosMedicalesResponse upsertInfos(UUID patientId, UpsertInfosMedicalesRequest req) {
        InfosMedicalesEntity e = infosRepo.findById(patientId).orElseGet(InfosMedicalesEntity::new);
        e.setPatientId(patientId);
        e.setGroupeSanguin(req.groupeSanguin());
        e.setAllergies(req.allergies());
        e.setAntecedents(req.antecedents());
        e.setTraitementsCours(req.traitementsCours());
        e.setNotesGenerales(req.notesGenerales());
        e.setUpdatedAt(LocalDateTime.now());
        return InfosMedicalesResponse.from(infosRepo.save(e));
    }

    @Transactional(readOnly = true)
    public List<OrdonnanceResponse> getOrdonnances(UUID patientId) {
        return ordonnanceRepo.findAllByPatientIdOrderByDateEmissionDesc(patientId)
            .stream().map(this::toOrdonnanceResponse).toList();
    }

    @Transactional
    public OrdonnanceResponse createOrdonnance(UUID patientId, CreateOrdonnanceRequest req) {
        OrdonnanceEntity e = new OrdonnanceEntity();
        e.setPatientId(patientId);
        e.setMedecinId(req.medecinId());
        e.setMedecinNom(req.medecinNom());
        e.setSource(req.source() != null ? req.source() : "MEDECIN");
        e.setDateEmission(req.dateEmission() != null ? req.dateEmission() : LocalDate.now());
        e.setNotes(req.notes());
        e.setCreatedAt(LocalDateTime.now());

        List<MedicamentDto> meds = req.medicaments() != null ? req.medicaments() : List.of();
        try {
            e.setMedicamentsJson(MAPPER.writeValueAsString(meds));
        } catch (Exception ex) {
            e.setMedicamentsJson("[]");
        }
        return toOrdonnanceResponse(ordonnanceRepo.save(e));
    }

    @Transactional
    public void deleteOrdonnance(UUID id) {
        ordonnanceRepo.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<DocumentMedicalResponse> getDocuments(UUID patientId) {
        return documentRepo.findAllByPatientIdOrderByCreatedAtDesc(patientId)
            .stream().map(DocumentMedicalResponse::from).toList();
    }

    public DocumentMedicalResponse uploadDocument(UUID patientId, String typeDoc, MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("Le fichier est vide");

        String originalName = file.getOriginalFilename() != null
                ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_")
                : "document";
        String objectKey = "dossier/" + patientId + "/" + UUID.randomUUID() + "_" + originalName;
        storageService.upload(objectKey, file);

        return saveDocumentRecord(patientId, originalName, typeDoc, objectKey, file.getSize());
    }

    @Transactional
    protected DocumentMedicalResponse saveDocumentRecord(UUID patientId, String nom, String typeDoc, String objectKey, long taille) {
        DocumentMedicalEntity e = new DocumentMedicalEntity();
        e.setPatientId(patientId);
        e.setNom(nom);
        e.setTypeDoc(typeDoc);
        e.setChemin(objectKey);
        e.setTaille(taille);
        e.setCreatedAt(LocalDateTime.now());
        return DocumentMedicalResponse.from(documentRepo.save(e));
    }

    @Transactional
    public void deleteDocument(UUID id) {
        documentRepo.findById(id).ifPresent(doc -> storageService.delete(doc.getChemin()));
        documentRepo.deleteById(id);
    }

    public record DownloadResult(Resource resource, String nom) {}

    @Transactional(readOnly = true)
    public DownloadResult downloadDocument(UUID id) throws IOException {
        DocumentMedicalEntity doc = documentRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Document not found: " + id));
        Resource resource = storageService.download(doc.getChemin());
        return new DownloadResult(resource, doc.getNom());
    }

    private OrdonnanceResponse toOrdonnanceResponse(OrdonnanceEntity e) {
        List<MedicamentDto> meds;
        try {
            meds = MAPPER.readValue(
                e.getMedicamentsJson() != null ? e.getMedicamentsJson() : "[]",
                new TypeReference<List<MedicamentDto>>() {});
        } catch (Exception ex) {
            meds = List.of();
        }
        return new OrdonnanceResponse(
            e.getId(),
            e.getPatientId(),
            e.getMedecinId(),
            e.getMedecinNom(),
            e.getSource() != null ? e.getSource() : "MEDECIN",
            e.getDateEmission(),
            meds,
            e.getNotes(),
            e.getFichierNom());
    }

    @Transactional
    public OrdonnanceResponse uploadOrdonnanceFichier(UUID ordonnanceId, MultipartFile file) throws IOException {
        OrdonnanceEntity ord = ordonnanceRepo.findById(ordonnanceId)
            .orElseThrow(() -> new IllegalArgumentException("Ordonnance introuvable: " + ordonnanceId));

        String originalName = file.getOriginalFilename() != null
            ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_") : "ordonnance";
        String objectKey = "ordonnances/" + ord.getPatientId() + "/" + UUID.randomUUID() + "_" + originalName;
        storageService.upload(objectKey, file);

        ord.setFichierChemin(objectKey);
        ord.setFichierNom(originalName);
        return toOrdonnanceResponse(ordonnanceRepo.save(ord));
    }

    public OrdonnanceResponse getOrdonnanceFichierName(UUID ordonnanceId) {
        OrdonnanceEntity ord = ordonnanceRepo.findById(ordonnanceId)
            .orElseThrow(() -> new IllegalArgumentException("Ordonnance introuvable: " + ordonnanceId));
        return toOrdonnanceResponse(ord);
    }

    public record OrdonnanceFichierResult(Resource resource, String nom) {}

    public OrdonnanceFichierResult downloadOrdonnanceFichier(UUID ordonnanceId) throws IOException {
        OrdonnanceEntity ord = ordonnanceRepo.findById(ordonnanceId)
            .orElseThrow(() -> new IllegalArgumentException("Ordonnance introuvable: " + ordonnanceId));
        if (ord.getFichierChemin() == null) throw new IllegalStateException("Aucun fichier joint");
        Resource resource = storageService.download(ord.getFichierChemin());
        return new OrdonnanceFichierResult(resource, ord.getFichierNom() != null ? ord.getFichierNom() : "ordonnance");
    }
}
