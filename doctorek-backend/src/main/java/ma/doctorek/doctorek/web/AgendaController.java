package ma.doctorek.doctorek.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.AddDocumentsRequisRequest;
import ma.doctorek.doctorek.dto.CreerRdvMedecinRequest;
import ma.doctorek.doctorek.dto.CreerRdvMedecinResponse;
import ma.doctorek.doctorek.dto.CreneauResponse;
import ma.doctorek.doctorek.dto.DocumentRequisResponse;
import ma.doctorek.doctorek.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.dto.DisponibiliteResponse;
import ma.doctorek.doctorek.dto.FamilleMembreResponse;
import ma.doctorek.doctorek.dto.PatientsPageResponse;
import ma.doctorek.doctorek.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.dto.RendezVousResponse;
import ma.doctorek.doctorek.dto.ReprogrammerRdvRequest;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.AccesPatientService;
import ma.doctorek.doctorek.service.AgendaService;
import ma.doctorek.doctorek.service.RdvPreparationService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agenda")
public class AgendaController {

    private final AgendaService agendaService;
    private final RdvPreparationService rdvPreparationService;
    private final AccesPatientService accesPatientService;
    private final UserRepository userRepo;

    public AgendaController(AgendaService agendaService,
                             RdvPreparationService rdvPreparationService,
                             AccesPatientService accesPatientService,
                             UserRepository userRepo) {
        this.agendaService = agendaService;
        this.rdvPreparationService = rdvPreparationService;
        this.accesPatientService = accesPatientService;
        this.userRepo = userRepo;
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
            Principal principal,
            @Valid @RequestBody PrendreRdvRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(agendaService.prendreRdv(request, resolveUserId(principal))));
    }

    /** Compte famille : le praticien crée un RDV (patient existant ou nouveau, sans compte). */
    @PreAuthorize("hasRole('MEDECIN')")
    @PostMapping("/medecins/rdv")
    public ResponseEntity<ApiResponse<CreerRdvMedecinResponse>> creerRdvMedecin(
            Principal principal,
            @Valid @RequestBody CreerRdvMedecinRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(agendaService.creerRdvParMedecin(resolveUserId(principal), request)));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    @GetMapping("/patients/{patientId}/rdv")
    public ResponseEntity<ApiResponse<List<RendezVousResponse>>> getRdvsPatient(
            Authentication authentication,
            @PathVariable UUID patientId) {
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin) {
            // Compte famille : un patient ne voit que ses RDV et ceux de ses proches gérés
            accesPatientService.verifierAcces(resolveUserId(authentication), patientId);
        }
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
    public ResponseEntity<ApiResponse<RendezVousResponse>> annulerRdv(
            @PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.annulerRdv(id, resolveUserId(principal))));
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

    // ── Préparation du RDV : documents demandés au patient ───────────────────

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN')")
    @GetMapping("/rdv/{id}/documents-requis")
    public ResponseEntity<ApiResponse<List<DocumentRequisResponse>>> listDocumentsRequis(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(rdvPreparationService.list(id)));
    }

    @PreAuthorize("hasRole('MEDECIN')")
    @PostMapping("/rdv/{id}/documents-requis")
    public ResponseEntity<ApiResponse<List<DocumentRequisResponse>>> addDocumentsRequis(
            @PathVariable UUID id,
            @Valid @RequestBody AddDocumentsRequisRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(rdvPreparationService.add(id, request.libelles())));
    }

    @PreAuthorize("hasRole('MEDECIN')")
    @DeleteMapping("/rdv/{id}/documents-requis/{docId}")
    public ResponseEntity<ApiResponse<Void>> removeDocumentRequis(
            @PathVariable UUID id,
            @PathVariable UUID docId) {
        rdvPreparationService.remove(id, docId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'MEDECIN')")
    @PutMapping("/rdv/{id}/documents-requis/{docId}/fournir")
    public ResponseEntity<ApiResponse<DocumentRequisResponse>> marquerDocumentFourni(
            @PathVariable UUID id,
            @PathVariable UUID docId,
            @RequestParam(defaultValue = "true") boolean fourni) {
        return ResponseEntity.ok(ApiResponse.ok(rdvPreparationService.marquerFourni(id, docId, fourni)));
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

    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    @GetMapping("/medecins/{medecinId}/patients/{patientId}/foyer")
    public ResponseEntity<ApiResponse<List<FamilleMembreResponse>>> getFoyerPatient(
            @PathVariable UUID medecinId,
            @PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.ok(agendaService.getFoyerPatient(medecinId, patientId)));
    }

    private UUID resolveUserId(Principal principal) {
        return userRepo.findByEmail(principal.getName())
            .map(User::getId)
            .orElseThrow();
    }
}
