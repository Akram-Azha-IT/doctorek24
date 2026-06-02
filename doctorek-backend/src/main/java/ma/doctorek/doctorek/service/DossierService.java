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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    private final String uploadDir;

    public DossierService(InfosMedicalesRepository infosRepo,
                           OrdonnanceRepository ordonnanceRepo,
                           DocumentMedicalRepository documentRepo,
                           @Value("${doctorek.upload.dir:${user.home}/doctorek-uploads}") String uploadDir) {
        this.infosRepo      = infosRepo;
        this.ordonnanceRepo = ordonnanceRepo;
        this.documentRepo   = documentRepo;
        this.uploadDir      = uploadDir;
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

    @Transactional
    public DocumentMedicalResponse uploadDocument(UUID patientId, String typeDoc, MultipartFile file) throws IOException {
        Path dir = Paths.get(uploadDir, "dossier", patientId.toString());
        Files.createDirectories(dir);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String fileName = UUID.randomUUID() + "_" + originalName;
        Path filePath = dir.resolve(fileName);
        file.transferTo(filePath);

        DocumentMedicalEntity e = new DocumentMedicalEntity();
        e.setPatientId(patientId);
        e.setNom(originalName);
        e.setTypeDoc(typeDoc);
        e.setChemin(filePath.toString());
        e.setTaille(file.getSize());
        e.setCreatedAt(LocalDateTime.now());
        return DocumentMedicalResponse.from(documentRepo.save(e));
    }

    @Transactional
    public void deleteDocument(UUID id) {
        documentRepo.findById(id).ifPresent(doc -> {
            try {
                Files.deleteIfExists(Paths.get(doc.getChemin()));
            } catch (IOException ignored) {}
        });
        documentRepo.deleteById(id);
    }

    public record DownloadResult(Resource resource, String nom) {}

    @Transactional(readOnly = true)
    public DownloadResult downloadDocument(UUID id) {
        DocumentMedicalEntity doc = documentRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Document not found: " + id));
        Resource resource = new PathResource(Paths.get(doc.getChemin()));
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
            e.getDateEmission(),
            meds,
            e.getNotes());
    }
}
