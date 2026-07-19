package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.dto.CreateOrdonnanceRequest;
import ma.doctorek.doctorek.dto.DocumentMedicalResponse;
import ma.doctorek.doctorek.dto.InfosMedicalesResponse;
import ma.doctorek.doctorek.dto.OrdonnanceResponse;
import ma.doctorek.doctorek.dto.UpsertInfosMedicalesRequest;
import ma.doctorek.doctorek.exception.AccesPatientRefuseException;
import ma.doctorek.doctorek.repository.DocumentMedicalRepository;
import ma.doctorek.doctorek.repository.OrdonnanceRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.AccesPatientService;
import ma.doctorek.doctorek.service.DossierService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dossier")
public class DossierController {

    private final DossierService dossierService;
    private final AccesPatientService accesPatientService;
    private final RendezVousRepository rdvRepo;
    private final OrdonnanceRepository ordonnanceRepo;
    private final DocumentMedicalRepository documentRepo;
    private final UserRepository userRepo;

    public DossierController(DossierService dossierService,
                             AccesPatientService accesPatientService,
                             RendezVousRepository rdvRepo,
                             OrdonnanceRepository ordonnanceRepo,
                             DocumentMedicalRepository documentRepo,
                             UserRepository userRepo) {
        this.dossierService = dossierService;
        this.accesPatientService = accesPatientService;
        this.rdvRepo = rdvRepo;
        this.ordonnanceRepo = ordonnanceRepo;
        this.documentRepo = documentRepo;
        this.userRepo = userRepo;
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patients/{patientId}/infos")
    public ResponseEntity<ApiResponse<InfosMedicalesResponse>> getInfos(Authentication auth,
                                                                        @PathVariable UUID patientId) {
        verifierAccesDossier(auth, patientId);
        return ResponseEntity.ok(ApiResponse.ok(dossierService.getInfos(patientId)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN')")
    @PutMapping("/patients/{patientId}/infos")
    public ResponseEntity<ApiResponse<InfosMedicalesResponse>> upsertInfos(
            Authentication auth,
            @PathVariable UUID patientId,
            @RequestBody UpsertInfosMedicalesRequest request) {
        verifierAccesDossier(auth, patientId);
        return ResponseEntity.ok(ApiResponse.ok(dossierService.upsertInfos(patientId, request)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patients/{patientId}/ordonnances")
    public ResponseEntity<ApiResponse<List<OrdonnanceResponse>>> getOrdonnances(Authentication auth,
                                                                                @PathVariable UUID patientId) {
        verifierAccesDossier(auth, patientId);
        return ResponseEntity.ok(ApiResponse.ok(dossierService.getOrdonnances(patientId)));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @PostMapping("/patients/{patientId}/ordonnances")
    public ResponseEntity<ApiResponse<OrdonnanceResponse>> createOrdonnance(
            Authentication auth,
            @PathVariable UUID patientId,
            @RequestBody CreateOrdonnanceRequest request) {
        verifierAccesDossier(auth, patientId);
        return ResponseEntity.ok(ApiResponse.ok(dossierService.createOrdonnance(patientId, request)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @DeleteMapping("/patients/{patientId}/ordonnances/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOrdonnance(
            Authentication auth,
            @PathVariable UUID patientId,
            @PathVariable UUID id) {
        verifierAccesOrdonnance(auth, id);
        dossierService.deleteOrdonnance(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @PostMapping(value = "/ordonnances/{ordonnanceId}/fichier", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OrdonnanceResponse>> uploadOrdonnanceFichier(
            Authentication auth,
            @PathVariable UUID ordonnanceId,
            @RequestParam("file") MultipartFile file) throws Exception {
        verifierAccesOrdonnance(auth, ordonnanceId);
        return ResponseEntity.ok(ApiResponse.ok(dossierService.uploadOrdonnanceFichier(ordonnanceId, file)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/ordonnances/{ordonnanceId}/fichier")
    public ResponseEntity<Resource> downloadOrdonnanceFichier(Authentication auth,
                                                              @PathVariable UUID ordonnanceId) throws Exception {
        verifierAccesOrdonnance(auth, ordonnanceId);
        var result = dossierService.downloadOrdonnanceFichier(ordonnanceId);
        MediaType contentType = MediaTypeFactory.getMediaType(result.nom()).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + result.nom() + "\"")
            .contentType(contentType)
            .body(result.resource());
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patients/{patientId}/documents")
    public ResponseEntity<ApiResponse<List<DocumentMedicalResponse>>> getDocuments(Authentication auth,
                                                                                   @PathVariable UUID patientId) {
        verifierAccesDossier(auth, patientId);
        return ResponseEntity.ok(ApiResponse.ok(dossierService.getDocuments(patientId)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN')")
    @PostMapping(value = "/patients/{patientId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentMedicalResponse>> uploadDocument(
            Authentication auth,
            @PathVariable UUID patientId,
            @RequestParam("typeDoc") String typeDoc,
            @RequestParam("file") MultipartFile file) throws Exception {
        verifierAccesDossier(auth, patientId);
        return ResponseEntity.ok(ApiResponse.ok(dossierService.uploadDocument(patientId, typeDoc, file)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @DeleteMapping("/patients/{patientId}/documents/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            Authentication auth,
            @PathVariable UUID patientId,
            @PathVariable UUID id) {
        verifierAccesDocument(auth, id);
        dossierService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patients/{patientId}/documents/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            Authentication auth,
            @PathVariable UUID patientId,
            @PathVariable UUID id) throws Exception {
        verifierAccesDocument(auth, id);
        var result = dossierService.downloadDocument(id);
        MediaType contentType = MediaTypeFactory.getMediaType(result.nom()).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + result.nom() + "\"")
            .contentType(contentType)
            .body(result.resource());
    }

    // ── Contrôle d'accès compte famille ─────────────────────────────────────
    // PATIENT : soi-même ou proche géré (gestion active).
    // MEDECIN : uniquement les patients avec qui il a (eu) un rendez-vous.
    // ADMIN : accès conservé.

    private void verifierAccesDossier(Authentication auth, UUID patientId) {
        if (hasRole(auth, "ADMIN")) return;
        UUID requesterId = resolveUserId(auth);
        if (hasRole(auth, "MEDECIN")) {
            if (!rdvRepo.existsByMedecinIdAndPatientId(requesterId, patientId)) {
                throw new AccesPatientRefuseException(patientId);
            }
        } else {
            accesPatientService.verifierAcces(requesterId, patientId);
        }
    }

    /** Le patientId du path ne prouve rien : on dérive celui de l'entité elle-même. */
    private void verifierAccesOrdonnance(Authentication auth, UUID ordonnanceId) {
        ordonnanceRepo.findById(ordonnanceId)
            .ifPresent(o -> verifierAccesDossier(auth, o.getPatientId()));
    }

    private void verifierAccesDocument(Authentication auth, UUID documentId) {
        documentRepo.findById(documentId)
            .ifPresent(d -> verifierAccesDossier(auth, d.getPatientId()));
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    private UUID resolveUserId(Authentication auth) {
        return userRepo.findByEmail(auth.getName())
            .map(u -> u.getId())
            .orElseThrow();
    }
}
