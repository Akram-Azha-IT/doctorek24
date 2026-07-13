package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.dto.CreateOrdonnanceRequest;
import ma.doctorek.doctorek.dto.DocumentMedicalResponse;
import ma.doctorek.doctorek.dto.InfosMedicalesResponse;
import ma.doctorek.doctorek.dto.OrdonnanceResponse;
import ma.doctorek.doctorek.dto.UpsertInfosMedicalesRequest;
import ma.doctorek.doctorek.service.DossierService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dossier")
public class DossierController {

    private final DossierService dossierService;

    public DossierController(DossierService dossierService) {
        this.dossierService = dossierService;
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patients/{patientId}/infos")
    public ResponseEntity<ApiResponse<InfosMedicalesResponse>> getInfos(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(dossierService.getInfos(patientId)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN')")
    @PutMapping("/patients/{patientId}/infos")
    public ResponseEntity<ApiResponse<InfosMedicalesResponse>> upsertInfos(
            @PathVariable UUID patientId,
            @RequestBody UpsertInfosMedicalesRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(dossierService.upsertInfos(patientId, request)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patients/{patientId}/ordonnances")
    public ResponseEntity<ApiResponse<List<OrdonnanceResponse>>> getOrdonnances(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(dossierService.getOrdonnances(patientId)));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")
    @PostMapping("/patients/{patientId}/ordonnances")
    public ResponseEntity<ApiResponse<OrdonnanceResponse>> createOrdonnance(
            @PathVariable UUID patientId,
            @RequestBody CreateOrdonnanceRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(dossierService.createOrdonnance(patientId, request)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @DeleteMapping("/patients/{patientId}/ordonnances/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOrdonnance(
            @PathVariable UUID patientId,
            @PathVariable UUID id) {
        dossierService.deleteOrdonnance(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @PostMapping(value = "/ordonnances/{ordonnanceId}/fichier", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OrdonnanceResponse>> uploadOrdonnanceFichier(
            @PathVariable UUID ordonnanceId,
            @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(ApiResponse.ok(dossierService.uploadOrdonnanceFichier(ordonnanceId, file)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/ordonnances/{ordonnanceId}/fichier")
    public ResponseEntity<Resource> downloadOrdonnanceFichier(@PathVariable UUID ordonnanceId) throws Exception {
        var result = dossierService.downloadOrdonnanceFichier(ordonnanceId);
        MediaType contentType = MediaTypeFactory.getMediaType(result.nom()).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + result.nom() + "\"")
            .contentType(contentType)
            .body(result.resource());
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patients/{patientId}/documents")
    public ResponseEntity<ApiResponse<List<DocumentMedicalResponse>>> getDocuments(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(dossierService.getDocuments(patientId)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN')")
    @PostMapping(value = "/patients/{patientId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentMedicalResponse>> uploadDocument(
            @PathVariable UUID patientId,
            @RequestParam("typeDoc") String typeDoc,
            @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(ApiResponse.ok(dossierService.uploadDocument(patientId, typeDoc, file)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @DeleteMapping("/patients/{patientId}/documents/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable UUID patientId,
            @PathVariable UUID id) {
        dossierService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patients/{patientId}/documents/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable UUID patientId,
            @PathVariable UUID id) throws Exception {
        var result = dossierService.downloadDocument(id);
        MediaType contentType = MediaTypeFactory.getMediaType(result.nom()).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + result.nom() + "\"")
            .contentType(contentType)
            .body(result.resource());
    }
}
