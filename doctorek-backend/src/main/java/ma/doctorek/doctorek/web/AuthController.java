package ma.doctorek.doctorek.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.CurrentUserResponse;
import ma.doctorek.doctorek.dto.MedecinRegisteredResponse;
import ma.doctorek.doctorek.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.dto.RegisterMedecinRequest;
import ma.doctorek.doctorek.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.dto.VerifyEmailRequest;
import ma.doctorek.doctorek.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
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

    /**
     * Resolves the local app account (DB id, role, names) for the caller's Keycloak JWT.
     * The frontend's session.user.id is the Keycloak subject — every other endpoint
     * keys off the local DB id, so the SPA calls this once after login to bridge the two.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> me(JwtAuthenticationToken authentication) {
        Jwt jwt = (Jwt) authentication.getCredentials();
        CurrentUserResponse response = authService.getCurrentUser(jwt);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
