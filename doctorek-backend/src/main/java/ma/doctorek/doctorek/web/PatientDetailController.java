package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.dto.PatientDetailRequest;
import ma.doctorek.doctorek.dto.PatientDetailResponse;
import ma.doctorek.doctorek.service.PatientDetailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientDetailController {

    private final PatientDetailService service;

    public PatientDetailController(PatientDetailService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<PatientDetailResponse>> get(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByUserId(userId)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<PatientDetailResponse>> upsert(@PathVariable UUID userId,
                                                                     @RequestBody PatientDetailRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.upsert(userId, req)));
    }
}
