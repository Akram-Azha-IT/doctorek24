package ma.doctorek.doctorek.carte.web;

import ma.doctorek.doctorek.carte.application.CreateCarteUseCase;
import ma.doctorek.doctorek.carte.application.GetCarteUseCase;
import ma.doctorek.doctorek.carte.application.UpdateCarteUseCase;
import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleRequest;
import ma.doctorek.doctorek.carte.application.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.carte.domain.CarteNotFoundException;
import ma.doctorek.doctorek.shared.web.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/carte")
public class CarteController {

    private final CreateCarteUseCase createUseCase;
    private final GetCarteUseCase getUseCase;
    private final UpdateCarteUseCase updateUseCase;

    public CarteController(CreateCarteUseCase createUseCase,
                           GetCarteUseCase getUseCase,
                           UpdateCarteUseCase updateUseCase) {
        this.createUseCase = createUseCase;
        this.getUseCase = getUseCase;
        this.updateUseCase = updateUseCase;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> create(@RequestBody CarteVirtuelleRequest req) {
        CarteVirtuelleResponse response = createUseCase.execute(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> getByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(getUseCase.byPatientId(patientId)));
    }

    @GetMapping("/patient/{patientId}/exists")
    public ResponseEntity<ApiResponse<Boolean>> exists(@PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(getUseCase.existsByPatientId(patientId)));
    }

    @GetMapping("/ref/{cardRef}")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> getByRef(@PathVariable String cardRef) {
        return ResponseEntity.ok(ApiResponse.ok(getUseCase.byCardRef(cardRef)));
    }

    @PutMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<CarteVirtuelleResponse>> update(@PathVariable UUID patientId,
                                                                       @RequestBody CarteVirtuelleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(updateUseCase.execute(patientId, req)));
    }

    @ExceptionHandler(CarteNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(CarteNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }
}
