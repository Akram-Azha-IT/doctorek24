package ma.doctorek.doctorek.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.CarteAccessResponse;
import ma.doctorek.doctorek.dto.CartePublicResponse;
import ma.doctorek.doctorek.dto.CarteSensibleResponse;
import ma.doctorek.doctorek.dto.CarteVirtuelleRequest;
import ma.doctorek.doctorek.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.dto.GoogleWalletSaveResponse;
import ma.doctorek.doctorek.dto.OtpChallengeResponse;
import ma.doctorek.doctorek.dto.OtpVerifyRequest;
import ma.doctorek.doctorek.entity.PatientDetailEntity;
import ma.doctorek.doctorek.exception.GoogleWalletDisabledException;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.repository.PatientDetailRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.CarteAccessService;
import ma.doctorek.doctorek.service.CarteService;
import ma.doctorek.doctorek.service.GoogleWalletService;
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
    private final CarteAccessService carteAccessService;
    private final UserRepository userRepository;
    private final PatientDetailRepository patientDetailRepository;
    private final GoogleWalletService googleWalletService;

    public CarteController(CarteService carteService,
                            CarteAccessService carteAccessService,
                            UserRepository userRepository,
                            PatientDetailRepository patientDetailRepository,
                            GoogleWalletService googleWalletService) {
        this.carteService = carteService;
        this.carteAccessService = carteAccessService;
        this.userRepository = userRepository;
        this.patientDetailRepository = patientDetailRepository;
        this.googleWalletService = googleWalletService;
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

    // Scan public du QR (urgence), no auth. Renvoie SEULEMENT le sous-ensemble vital,
    // jamais medicaments/antecedents/assurance (ceux-ci passent par l'OTP ci-dessous).
    @GetMapping("/ref/{cardRef}")
    public ResponseEntity<ApiResponse<CartePublicResponse>> getByRef(@PathVariable String cardRef) {
        return ResponseEntity.ok(ApiResponse.ok(carteService.getPublicByCardRef(cardRef)));
    }

    // Demande d'un OTP : code envoyé au PATIENT (consentement), pas au scanneur. No auth, rate-limité.
    @PostMapping("/ref/{cardRef}/otp")
    public ResponseEntity<ApiResponse<OtpChallengeResponse>> requestOtp(@PathVariable String cardRef) {
        return ResponseEntity.ok(ApiResponse.ok(carteAccessService.requestOtp(cardRef)));
    }

    // Validation de l'OTP : renvoie un jeton d'accès court en cas de succès.
    @PostMapping("/ref/{cardRef}/otp/verify")
    public ResponseEntity<ApiResponse<CarteAccessResponse>> verifyOtp(
            @PathVariable String cardRef,
            @Valid @RequestBody OtpVerifyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(carteAccessService.verifyOtp(cardRef, req.code())));
    }

    // Lecture des données sensibles : exige le jeton délivré après OTP (header X-Carte-Access).
    @GetMapping("/ref/{cardRef}/sensible")
    public ResponseEntity<ApiResponse<CarteSensibleResponse>> getSensible(
            @PathVariable String cardRef,
            @RequestHeader(name = "X-Carte-Access", required = false) String accessToken) {
        return ResponseEntity.ok(ApiResponse.ok(carteAccessService.getSensible(cardRef, accessToken)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> update(
            @PathVariable UUID patientId,
            @RequestBody CarteVirtuelleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(carteService.update(patientId, req)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN', 'ADMIN')")
    @GetMapping("/patient/{patientId}/wallet/google")
    public ResponseEntity<ApiResponse<GoogleWalletSaveResponse>> getGoogleWalletSaveUrl(@PathVariable UUID patientId) {
        if (!googleWalletService.isEnabled()) {
            throw new GoogleWalletDisabledException();
        }
        CarteVirtuelleResponse carte = carteService.getByPatientId(patientId);
        var detail = patientDetailRepository.findById(patientId);
        String numIdentite = detail.map(PatientDetailEntity::getNumIdentite).orElse(null);

        // Prefer an uploaded photo; fall back to a social-login avatar so the pass still has a picture.
        String uploadedPhoto = detail.map(PatientDetailEntity::getPhotoUrl).orElse(null);
        String photoUrl = (uploadedPhoto != null && !uploadedPhoto.isBlank())
                ? uploadedPhoto
                : userRepository.findById(patientId).map(u -> u.getAvatarUrl()).orElse(null);

        String saveUrl = googleWalletService.buildSaveUrl(
                carte.cardRef(), carte.firstName(), carte.lastName(), numIdentite,
                carte.assuranceNumero(), photoUrl);

        return ResponseEntity.ok(ApiResponse.ok(new GoogleWalletSaveResponse(saveUrl)));
    }

    private UUID resolvePatientId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new UserNotFoundException(principal.getName()));
    }
}
