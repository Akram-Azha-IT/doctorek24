package ma.doctorek.doctorek.agenda.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.agenda.application.AnnulerRendezVousUseCase;
import ma.doctorek.doctorek.agenda.application.ConfirmerRendezVousUseCase;
import ma.doctorek.doctorek.agenda.application.DeleteDisponibiliteUseCase;
import ma.doctorek.doctorek.agenda.application.DefineDisponibiliteUseCase;
import ma.doctorek.doctorek.agenda.application.GetCreneauxDisponiblesUseCase;
import ma.doctorek.doctorek.agenda.application.GetDisponibilitesUseCase;
import ma.doctorek.doctorek.agenda.application.GetPatientsMedecinUseCase;
import ma.doctorek.doctorek.agenda.application.GetRdvsMedecinUseCase;
import ma.doctorek.doctorek.agenda.application.GetRdvsPatientUseCase;
import ma.doctorek.doctorek.agenda.application.PrendreRdvUseCase;
import ma.doctorek.doctorek.agenda.application.ReprogrammerRendezVousUseCase;
import ma.doctorek.doctorek.agenda.application.TerminerRendezVousUseCase;
import ma.doctorek.doctorek.agenda.application.dto.CreneauResponse;
import ma.doctorek.doctorek.agenda.application.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.agenda.application.dto.DisponibiliteResponse;
import ma.doctorek.doctorek.agenda.application.dto.PatientSummaryResponse;
import ma.doctorek.doctorek.agenda.application.dto.PatientsPageResponse;
import ma.doctorek.doctorek.agenda.application.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.agenda.application.dto.RendezVousResponse;
import ma.doctorek.doctorek.agenda.application.dto.ReprogrammerRdvRequest;
import ma.doctorek.doctorek.shared.web.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agenda")
public class AgendaController {

    private final DefineDisponibiliteUseCase    defineDisponibiliteUseCase;
    private final DeleteDisponibiliteUseCase    deleteDisponibiliteUseCase;
    private final GetDisponibilitesUseCase      getDisponibilitesUseCase;
    private final GetCreneauxDisponiblesUseCase getCreneauxDisponiblesUseCase;
    private final PrendreRdvUseCase             prendreRdvUseCase;
    private final GetRdvsPatientUseCase         getRdvsPatientUseCase;
    private final AnnulerRendezVousUseCase      annulerRendezVousUseCase;
    private final ConfirmerRendezVousUseCase    confirmerRendezVousUseCase;
    private final TerminerRendezVousUseCase     terminerRendezVousUseCase;
    private final GetRdvsMedecinUseCase         getRdvsMedecinUseCase;
    private final ReprogrammerRendezVousUseCase reprogrammerRendezVousUseCase;
    private final GetPatientsMedecinUseCase     getPatientsMedecinUseCase;

    public AgendaController(DefineDisponibiliteUseCase defineDisponibiliteUseCase,
                             DeleteDisponibiliteUseCase deleteDisponibiliteUseCase,
                             GetDisponibilitesUseCase getDisponibilitesUseCase,
                             GetCreneauxDisponiblesUseCase getCreneauxDisponiblesUseCase,
                             PrendreRdvUseCase prendreRdvUseCase,
                             GetRdvsPatientUseCase getRdvsPatientUseCase,
                             AnnulerRendezVousUseCase annulerRendezVousUseCase,
                             ConfirmerRendezVousUseCase confirmerRendezVousUseCase,
                             TerminerRendezVousUseCase terminerRendezVousUseCase,
                             GetRdvsMedecinUseCase getRdvsMedecinUseCase,
                             ReprogrammerRendezVousUseCase reprogrammerRendezVousUseCase,
                             GetPatientsMedecinUseCase getPatientsMedecinUseCase) {
        this.defineDisponibiliteUseCase    = defineDisponibiliteUseCase;
        this.deleteDisponibiliteUseCase    = deleteDisponibiliteUseCase;
        this.getDisponibilitesUseCase      = getDisponibilitesUseCase;
        this.getCreneauxDisponiblesUseCase = getCreneauxDisponiblesUseCase;
        this.prendreRdvUseCase             = prendreRdvUseCase;
        this.getRdvsPatientUseCase         = getRdvsPatientUseCase;
        this.annulerRendezVousUseCase      = annulerRendezVousUseCase;
        this.confirmerRendezVousUseCase    = confirmerRendezVousUseCase;
        this.terminerRendezVousUseCase     = terminerRendezVousUseCase;
        this.getRdvsMedecinUseCase         = getRdvsMedecinUseCase;
        this.reprogrammerRendezVousUseCase = reprogrammerRendezVousUseCase;
        this.getPatientsMedecinUseCase     = getPatientsMedecinUseCase;
    }

    @PostMapping("/medecins/{medecinId}/disponibilites")
    public ResponseEntity<ApiResponse<DisponibiliteResponse>> defineDisponibilite(
            @PathVariable UUID medecinId,
            @Valid @RequestBody DefineDisponibiliteRequest request) {
        DisponibiliteResponse response = DisponibiliteResponse.from(
            defineDisponibiliteUseCase.execute(medecinId, request)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/medecins/{medecinId}/disponibilites/{dispoId}")
    public ResponseEntity<ApiResponse<Void>> deleteDisponibilite(
            @PathVariable UUID medecinId,
            @PathVariable UUID dispoId) {
        deleteDisponibiliteUseCase.execute(medecinId, dispoId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/medecins/{medecinId}/disponibilites")
    public ResponseEntity<ApiResponse<List<DisponibiliteResponse>>> getDisponibilites(
            @PathVariable UUID medecinId) {
        List<DisponibiliteResponse> responses = getDisponibilitesUseCase.execute(medecinId)
            .stream()
            .map(DisponibiliteResponse::from)
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @GetMapping("/medecins/{medecinId}/creneaux")
    public ResponseEntity<ApiResponse<List<CreneauResponse>>> getCreneaux(
            @PathVariable UUID medecinId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<CreneauResponse> responses = getCreneauxDisponiblesUseCase.execute(medecinId, date)
            .stream()
            .map(CreneauResponse::from)
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @PostMapping("/rdv")
    public ResponseEntity<ApiResponse<RendezVousResponse>> prendreRdv(
            @Valid @RequestBody PrendreRdvRequest request) {
        RendezVousResponse response = RendezVousResponse.from(prendreRdvUseCase.execute(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/patients/{patientId}/rdv")
    public ResponseEntity<ApiResponse<List<RendezVousResponse>>> getRdvsPatient(
            @PathVariable UUID patientId) {
        List<RendezVousResponse> responses = getRdvsPatientUseCase.execute(patientId)
            .stream()
            .map(RendezVousResponse::from)
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @GetMapping("/medecins/{medecinId}/rdv")
    public ResponseEntity<ApiResponse<List<RendezVousResponse>>> getRdvsMedecin(
            @PathVariable UUID medecinId) {
        return ResponseEntity.ok(ApiResponse.ok(getRdvsMedecinUseCase.execute(medecinId)));
    }

    @PutMapping("/rdv/{id}/annuler")
    public ResponseEntity<ApiResponse<RendezVousResponse>> annulerRdv(
            @PathVariable UUID id) {
        RendezVousResponse response = RendezVousResponse.from(annulerRendezVousUseCase.execute(id));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/rdv/{id}/confirmer")
    public ResponseEntity<ApiResponse<RendezVousResponse>> confirmerRdv(
            @PathVariable UUID id) {
        RendezVousResponse response = RendezVousResponse.from(confirmerRendezVousUseCase.execute(id));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/rdv/{id}/terminer")
    public ResponseEntity<ApiResponse<RendezVousResponse>> terminerRdv(
            @PathVariable UUID id) {
        RendezVousResponse response = RendezVousResponse.from(terminerRendezVousUseCase.execute(id));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/medecins/{medecinId}/patients")
    public ResponseEntity<ApiResponse<PatientsPageResponse>> getPatientsMedecin(
            @PathVariable UUID medecinId,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "TOUS") String filtre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<PatientSummaryResponse> patients = getPatientsMedecinUseCase
            .execute(medecinId, search, filtre, page, size)
            .stream()
            .map(PatientSummaryResponse::from)
            .toList();
        long total = getPatientsMedecinUseCase.count(medecinId, search, filtre);
        return ResponseEntity.ok(ApiResponse.ok(new PatientsPageResponse(patients, total, page, size)));
    }

    @PutMapping("/rdv/{id}/reprogrammer")
    public ResponseEntity<ApiResponse<RendezVousResponse>> reprogrammerRdv(
            @PathVariable UUID id,
            @Valid @RequestBody ReprogrammerRdvRequest request) {
        RendezVousResponse response = RendezVousResponse.from(
            reprogrammerRendezVousUseCase.execute(id, request.nouvelleDateRdv(), request.nouvelleHeureRdv())
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
