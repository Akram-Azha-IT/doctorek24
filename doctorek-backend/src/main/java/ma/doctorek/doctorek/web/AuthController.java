package ma.doctorek.doctorek.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.LoginRequest;
import ma.doctorek.doctorek.dto.LoginResponse;
import ma.doctorek.doctorek.dto.MedecinRegisteredResponse;
import ma.doctorek.doctorek.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.dto.RefreshRequest;
import ma.doctorek.doctorek.dto.RefreshResponse;
import ma.doctorek.doctorek.dto.RegisterMedecinRequest;
import ma.doctorek.doctorek.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.dto.VerifyEmailRequest;
import ma.doctorek.doctorek.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/patient")
    public ResponseEntity<ApiResponse<PatientRegisteredResponse>> registerPatient(
            @Valid @RequestBody RegisterPatientRequest request) {
        PatientRegisteredResponse response = authService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/register/medecin")
    public ResponseEntity<ApiResponse<MedecinRegisteredResponse>> registerMedecin(
            @Valid @RequestBody RegisterMedecinRequest request) {
        MedecinRegisteredResponse response = authService.registerMedecin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshResponse>> refresh(
            @Valid @RequestBody RefreshRequest request) {
        RefreshResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
