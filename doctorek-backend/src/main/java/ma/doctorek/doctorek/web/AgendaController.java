package ma.doctorek.doctorek.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.CreneauResponse;
import ma.doctorek.doctorek.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.dto.DisponibiliteResponse;
import ma.doctorek.doctorek.dto.PatientsPageResponse;
import ma.doctorek.doctorek.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.dto.RendezVousResponse;
import ma.doctorek.doctorek.dto.ReprogrammerRdvRequest;
import ma.doctorek.doctorek.service.AgendaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agenda")
public class AgendaController {

    private final AgendaService agendaService;

    public AgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    @PreAuthorize("hasRole('MEDECIN')")
    @PostMapping("/medecins/{medecinId}/disponibilites")
    public ResponseEntity<ApiResponse<DisponibiliteResponse>> defineDisponibilite(
            @PathVariable UUID medecinId,
            @Valid @RequestBody DefineDisponibiliteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(agendaService.defineDisponibilite(medecinId, request)));
    }

    @PreAuthorize("hasRole('MEDECIN')")
    @DeleteMapping("/medecins/{medecinId}/disponibilites/{dispoId}")
    public ResponseEntity<ApiResponse<Void>> deleteDisponibilite(
            @PathVariable UUID medecinId,
            @PathVariable UUID dispoId) {
        agendaService.deleteDisponibilite(medecinId, dispoId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @GetMapping("/medecins/{medecinId}/disponibilites")
    public ResponseEntity<ApiResponse<List<DisponibiliteResponse>>> getDisponibilites(
            @PathVariable UUID medecinId) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.getDisponibilites(medecinId)));
    }

    @GetMapping("/medecins/{medecinId}/creneaux")
    public ResponseEntity<ApiResponse<List<CreneauResponse>>> getCreneaux(
            @PathVariable UUID medecinId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.getCreneauxDisponibles(medecinId, date)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping("/rdv")
    public ResponseEntity<ApiResponse<RendezVousResponse>> prendreRdv(
            @Valid @RequestBody PrendreRdvRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(agendaService.prendreRdv(request)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    @GetMapping("/patients/{patientId}/rdv")
    public ResponseEntity<ApiResponse<List<RendezVousResponse>>> getRdvsPatient(
            @PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.getRdvsPatient(patientId)));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @GetMapping("/medecins/{medecinId}/rdv")
    public ResponseEntity<ApiResponse<List<RendezVousResponse>>> getRdvsMedecin(
            @PathVariable UUID medecinId) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.getRdvsMedecin(medecinId)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN')")
    @PutMapping("/rdv/{id}/annuler")
    public ResponseEntity<ApiResponse<RendezVousResponse>> annulerRdv(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.annulerRdv(id)));
    }

    @PreAuthorize("hasRole('MEDECIN')")
    @PutMapping("/rdv/{id}/confirmer")
    public ResponseEntity<ApiResponse<RendezVousResponse>> confirmerRdv(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.confirmerRdv(id)));
    }

    @PreAuthorize("hasRole('MEDECIN')")
    @PutMapping("/rdv/{id}/terminer")
    public ResponseEntity<ApiResponse<RendezVousResponse>> terminerRdv(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.terminerRdv(id)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN')")
    @PutMapping("/rdv/{id}/reprogrammer")
    public ResponseEntity<ApiResponse<RendezVousResponse>> reprogrammerRdv(
            @PathVariable UUID id,
            @Valid @RequestBody ReprogrammerRdvRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
            agendaService.reprogrammerRdv(id, request.dateRdv(), request.heureRdv())));
    }

    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @GetMapping("/medecins/{medecinId}/patients")
    public ResponseEntity<ApiResponse<PatientsPageResponse>> getPatientsMedecin(
            @PathVariable UUID medecinId,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "TOUS") String filtre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
            agendaService.getPatientsMedecin(medecinId, search, filtre, page, size)));
    }
}
