package ma.doctorek.doctorek.agenda.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.agenda.application.AnnulerRendezVousUseCase;
import ma.doctorek.doctorek.agenda.application.ConfirmerRendezVousUseCase;
import ma.doctorek.doctorek.agenda.application.DefineDisponibiliteUseCase;
import ma.doctorek.doctorek.agenda.application.GetCreneauxDisponiblesUseCase;
import ma.doctorek.doctorek.agenda.application.GetDisponibilitesUseCase;
import ma.doctorek.doctorek.agenda.application.GetRdvsMedecinUseCase;
import ma.doctorek.doctorek.agenda.application.GetRdvsPatientUseCase;
import ma.doctorek.doctorek.agenda.application.PrendreRdvUseCase;
import ma.doctorek.doctorek.agenda.application.TerminerRendezVousUseCase;
import ma.doctorek.doctorek.agenda.application.dto.CreneauResponse;
import ma.doctorek.doctorek.agenda.application.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.agenda.application.dto.DisponibiliteResponse;
import ma.doctorek.doctorek.agenda.application.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.agenda.application.dto.RendezVousResponse;
import ma.doctorek.doctorek.auth.domain.UserRepository;
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
    private final GetDisponibilitesUseCase      getDisponibilitesUseCase;
    private final GetCreneauxDisponiblesUseCase getCreneauxDisponiblesUseCase;
    private final PrendreRdvUseCase             prendreRdvUseCase;
    private final GetRdvsPatientUseCase         getRdvsPatientUseCase;
    private final AnnulerRendezVousUseCase      annulerRendezVousUseCase;
    private final ConfirmerRendezVousUseCase    confirmerRendezVousUseCase;
    private final TerminerRendezVousUseCase     terminerRendezVousUseCase;
    private final GetRdvsMedecinUseCase         getRdvsMedecinUseCase;
    private final UserRepository                userRepository;

    public AgendaController(DefineDisponibiliteUseCase defineDisponibiliteUseCase,
                             GetDisponibilitesUseCase getDisponibilitesUseCase,
                             GetCreneauxDisponiblesUseCase getCreneauxDisponiblesUseCase,
                             PrendreRdvUseCase prendreRdvUseCase,
                             GetRdvsPatientUseCase getRdvsPatientUseCase,
                             AnnulerRendezVousUseCase annulerRendezVousUseCase,
                             ConfirmerRendezVousUseCase confirmerRendezVousUseCase,
                             TerminerRendezVousUseCase terminerRendezVousUseCase,
                             GetRdvsMedecinUseCase getRdvsMedecinUseCase,
                             UserRepository userRepository) {
        this.defineDisponibiliteUseCase    = defineDisponibiliteUseCase;
        this.getDisponibilitesUseCase      = getDisponibilitesUseCase;
        this.getCreneauxDisponiblesUseCase = getCreneauxDisponiblesUseCase;
        this.prendreRdvUseCase             = prendreRdvUseCase;
        this.getRdvsPatientUseCase         = getRdvsPatientUseCase;
        this.annulerRendezVousUseCase      = annulerRendezVousUseCase;
        this.confirmerRendezVousUseCase    = confirmerRendezVousUseCase;
        this.terminerRendezVousUseCase     = terminerRendezVousUseCase;
        this.getRdvsMedecinUseCase         = getRdvsMedecinUseCase;
        this.userRepository                = userRepository;
    }

    /**
     * POST /api/v1/agenda/medecins/{medecinId}/disponibilites
     * Définit (ou remplace) la disponibilité d'un médecin pour un jour donné.
     */
    @PostMapping("/medecins/{medecinId}/disponibilites")
    public ResponseEntity<ApiResponse<DisponibiliteResponse>> defineDisponibilite(
            @PathVariable UUID medecinId,
            @Valid @RequestBody DefineDisponibiliteRequest request) {
        DisponibiliteResponse response = DisponibiliteResponse.from(
            defineDisponibiliteUseCase.execute(medecinId, request)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * GET /api/v1/agenda/medecins/{medecinId}/disponibilites
     * Retourne toutes les disponibilités hebdomadaires d'un médecin.
     */
    @GetMapping("/medecins/{medecinId}/disponibilites")
    public ResponseEntity<ApiResponse<List<DisponibiliteResponse>>> getDisponibilites(
            @PathVariable UUID medecinId) {
        List<DisponibiliteResponse> responses = getDisponibilitesUseCase.execute(medecinId)
            .stream()
            .map(DisponibiliteResponse::from)
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    /**
     * GET /api/v1/agenda/medecins/{medecinId}/creneaux?date=YYYY-MM-DD
     * Retourne les créneaux disponibles et pris pour une date donnée.
     */
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

    /**
     * POST /api/v1/agenda/rdv
     * Prend un rendez-vous pour un patient chez un médecin.
     */
    @PostMapping("/rdv")
    public ResponseEntity<ApiResponse<RendezVousResponse>> prendreRdv(
            @Valid @RequestBody PrendreRdvRequest request) {
        RendezVousResponse response = RendezVousResponse.from(prendreRdvUseCase.execute(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * GET /api/v1/agenda/patients/{patientId}/rdv
     * Retourne tous les rendez-vous d'un patient.
     */
    @GetMapping("/patients/{patientId}/rdv")
    public ResponseEntity<ApiResponse<List<RendezVousResponse>>> getRdvsPatient(
            @PathVariable UUID patientId) {
        List<RendezVousResponse> responses = getRdvsPatientUseCase.execute(patientId)
            .stream()
            .map(RendezVousResponse::from)
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    /**
     * GET /api/v1/agenda/medecins/{medecinId}/rdv
     * Retourne tous les rendez-vous d'un médecin.
     */
    @GetMapping("/medecins/{medecinId}/rdv")
    public ResponseEntity<ApiResponse<List<RendezVousResponse>>> getRdvsMedecin(
            @PathVariable UUID medecinId) {
        List<RendezVousResponse> responses = getRdvsMedecinUseCase.execute(medecinId)
            .stream()
            .map(rdv -> userRepository.findById(rdv.patientId())
                .map(u -> RendezVousResponse.from(rdv, u.getFirstName(), u.getLastName()))
                .orElseGet(() -> RendezVousResponse.from(rdv)))
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    /**
     * PUT /api/v1/agenda/rdv/{id}/annuler
     * Annule un rendez-vous existant.
     */
    @PutMapping("/rdv/{id}/annuler")
    public ResponseEntity<ApiResponse<RendezVousResponse>> annulerRdv(
            @PathVariable UUID id) {
        RendezVousResponse response = RendezVousResponse.from(annulerRendezVousUseCase.execute(id));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * PUT /api/v1/agenda/rdv/{id}/confirmer
     * Confirme un rendez-vous en attente.
     */
    @PutMapping("/rdv/{id}/confirmer")
    public ResponseEntity<ApiResponse<RendezVousResponse>> confirmerRdv(
            @PathVariable UUID id) {
        RendezVousResponse response = RendezVousResponse.from(confirmerRendezVousUseCase.execute(id));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * PUT /api/v1/agenda/rdv/{id}/terminer
     * Marque un rendez-vous confirmé comme terminé.
     */
    @PutMapping("/rdv/{id}/terminer")
    public ResponseEntity<ApiResponse<RendezVousResponse>> terminerRdv(
            @PathVariable UUID id) {
        RendezVousResponse response = RendezVousResponse.from(terminerRendezVousUseCase.execute(id));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
