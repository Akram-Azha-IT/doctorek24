package ma.doctorek.doctorek.auth.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.auth.application.RegisterPatientUseCase;
import ma.doctorek.doctorek.auth.application.dto.PatientRegisteredResponse;
import ma.doctorek.doctorek.auth.application.dto.RegisterPatientRequest;
import ma.doctorek.doctorek.shared.web.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final RegisterPatientUseCase registerPatientUseCase;

    public AuthController(RegisterPatientUseCase registerPatientUseCase) {
        this.registerPatientUseCase = registerPatientUseCase;
    }

    /**
     * POST /api/v1/auth/register/patient
     * Inscription d'un nouveau patient.
     */
    @PostMapping("/register/patient")
    public ResponseEntity<ApiResponse<PatientRegisteredResponse>> registerPatient(
        @Valid @RequestBody RegisterPatientRequest request
    ) {
        PatientRegisteredResponse response = registerPatientUseCase.execute(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }
}
