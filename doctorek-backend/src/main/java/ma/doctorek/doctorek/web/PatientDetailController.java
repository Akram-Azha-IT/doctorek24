package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.dto.PatientDetailRequest;
import ma.doctorek.doctorek.dto.PatientDetailResponse;
import ma.doctorek.doctorek.exception.AccesPatientRefuseException;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.AccesPatientService;
import ma.doctorek.doctorek.service.PatientDetailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientDetailController {

    private final PatientDetailService service;
    private final AccesPatientService accesPatientService;
    private final RendezVousRepository rdvRepository;
    private final UserRepository userRepository;

    public PatientDetailController(PatientDetailService service,
                                   AccesPatientService accesPatientService,
                                   RendezVousRepository rdvRepository,
                                   UserRepository userRepository) {
        this.service = service;
        this.accesPatientService = accesPatientService;
        this.rdvRepository = rdvRepository;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<PatientDetailResponse>> get(Authentication auth, @PathVariable UUID userId) {
        verifierAcces(auth, userId);
        return ResponseEntity.ok(ApiResponse.ok(service.getByUserId(userId)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<PatientDetailResponse>> upsert(Authentication auth,
                                                                     @PathVariable UUID userId,
                                                                     @RequestBody PatientDetailRequest req) {
        verifierAcces(auth, userId);
        return ResponseEntity.ok(ApiResponse.ok(service.upsert(userId, req)));
    }

    private void verifierAcces(Authentication auth, UUID patientId) {
        if (hasRole(auth, "ADMIN")) return;
        UUID requesterId = userRepository.findByEmail(auth.getName()).map(user -> user.getId()).orElseThrow();
        if (hasRole(auth, "MEDECIN")) {
            if (!rdvRepository.existsByMedecinIdAndPatientId(requesterId, patientId)) throw new AccesPatientRefuseException(patientId);
        } else {
            accesPatientService.verifierAcces(requesterId, patientId);
        }
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }
}
