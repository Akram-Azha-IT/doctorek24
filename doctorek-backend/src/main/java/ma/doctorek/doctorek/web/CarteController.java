package ma.doctorek.doctorek.web;

import ma.doctorek.doctorek.dto.CarteVirtuelleRequest;
import ma.doctorek.doctorek.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.CarteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/carte")
public class CarteController {

    private final CarteService carteService;
    private final UserRepository userRepository;

    public CarteController(CarteService carteService, UserRepository userRepository) {
        this.carteService = carteService;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> create(
            @RequestBody CarteVirtuelleRequest req,
            Principal principal) {
        UUID patientId = resolvePatientId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(carteService.create(req, patientId)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> getByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(carteService.getByPatientId(patientId)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patient/{patientId}/exists")
    public ResponseEntity<ApiResponse<Boolean>> exists(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(carteService.existsByPatientId(patientId)));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @GetMapping("/ref/{cardRef}")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> getByRef(@PathVariable String cardRef) {
        return ResponseEntity.ok(ApiResponse.ok(carteService.getByCardRef(cardRef)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> update(
            @PathVariable UUID patientId,
            @RequestBody CarteVirtuelleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(carteService.update(patientId, req)));
    }

    private UUID resolvePatientId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new UserNotFoundException(principal.getName()));
    }
}
