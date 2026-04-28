package ma.doctorek.doctorek.dossier.web;

import ma.doctorek.doctorek.dossier.application.*;
import ma.doctorek.doctorek.dossier.application.dto.*;
import ma.doctorek.doctorek.shared.web.ApiResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dossier")
public class DossierController {

    private final GetInfosMedicalesUseCase getInfos;
    private final UpsertInfosMedicalesUseCase upsertInfos;
    private final GetOrdonnancesUseCase getOrdonnances;
    private final CreateOrdonnanceUseCase createOrdonnance;
    private final DeleteOrdonnanceUseCase deleteOrdonnance;
    private final GetDocumentsUseCase getDocuments;
    private final UploadDocumentUseCase uploadDocument;
    private final DeleteDocumentUseCase deleteDocument;
    private final DownloadDocumentUseCase downloadDocument;

    public DossierController(
        GetInfosMedicalesUseCase getInfos,
        UpsertInfosMedicalesUseCase upsertInfos,
        GetOrdonnancesUseCase getOrdonnances,
        CreateOrdonnanceUseCase createOrdonnance,
        DeleteOrdonnanceUseCase deleteOrdonnance,
        GetDocumentsUseCase getDocuments,
        UploadDocumentUseCase uploadDocument,
        DeleteDocumentUseCase deleteDocument,
        DownloadDocumentUseCase downloadDocument
    ) {
        this.getInfos = getInfos;
        this.upsertInfos = upsertInfos;
        this.getOrdonnances = getOrdonnances;
        this.createOrdonnance = createOrdonnance;
        this.deleteOrdonnance = deleteOrdonnance;
        this.getDocuments = getDocuments;
        this.uploadDocument = uploadDocument;
        this.deleteDocument = deleteDocument;
        this.downloadDocument = downloadDocument;
    }

    @GetMapping("/patients/{patientId}/infos")
    public ResponseEntity<ApiResponse<InfosMedicalesResponse>> getInfos(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(getInfos.execute(patientId)));
    }

    @PutMapping("/patients/{patientId}/infos")
    public ResponseEntity<ApiResponse<InfosMedicalesResponse>> upsertInfos(
        @PathVariable UUID patientId,
        @RequestBody UpsertInfosMedicalesRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(upsertInfos.execute(patientId, request)));
    }

    @GetMapping("/patients/{patientId}/ordonnances")
    public ResponseEntity<ApiResponse<List<OrdonnanceResponse>>> getOrdonnances(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(getOrdonnances.execute(patientId)));
    }

    @PostMapping("/patients/{patientId}/ordonnances")
    public ResponseEntity<ApiResponse<OrdonnanceResponse>> createOrdonnance(
        @PathVariable UUID patientId,
        @RequestBody CreateOrdonnanceRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(createOrdonnance.execute(patientId, request)));
    }

    @DeleteMapping("/patients/{patientId}/ordonnances/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOrdonnance(
        @PathVariable UUID patientId,
        @PathVariable UUID id
    ) {
        deleteOrdonnance.execute(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/patients/{patientId}/documents")
    public ResponseEntity<ApiResponse<List<DocumentMedicalResponse>>> getDocuments(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(getDocuments.execute(patientId)));
    }

    @PostMapping(value = "/patients/{patientId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentMedicalResponse>> uploadDocument(
        @PathVariable UUID patientId,
        @RequestParam("typeDoc") String typeDoc,
        @RequestParam("file") MultipartFile file
    ) throws Exception {
        return ResponseEntity.ok(ApiResponse.ok(uploadDocument.execute(patientId, typeDoc, file)));
    }

    @DeleteMapping("/patients/{patientId}/documents/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
        @PathVariable UUID patientId,
        @PathVariable UUID id
    ) {
        deleteDocument.execute(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/patients/{patientId}/documents/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(
        @PathVariable UUID patientId,
        @PathVariable UUID id
    ) {
        var result = downloadDocument.execute(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.nom() + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(result.resource());
    }
}
