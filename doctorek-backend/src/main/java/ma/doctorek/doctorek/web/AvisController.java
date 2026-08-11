package ma.doctorek.doctorek.web;

import jakarta.validation.Valid;
import ma.doctorek.doctorek.dto.AvisPageResponse;
import ma.doctorek.doctorek.dto.AvisResponse;
import ma.doctorek.doctorek.dto.CreerAvisRequest;
import ma.doctorek.doctorek.dto.NoteMedecinResponse;
import ma.doctorek.doctorek.dto.RdvsNotablesRequest;
import ma.doctorek.doctorek.dto.SignalerAvisRequest;
import ma.doctorek.doctorek.enums.StatutAvis;
import ma.doctorek.doctorek.service.AvisService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Avis des patients sur les médecins.
 *
 * <p>La lecture est publique — le profil médecin l'est aussi. L'écriture exige un compte,
 * et le service refuse tout avis qui n'est pas adossé à un rendez-vous terminé de l'appelant.
 */
@RestController
@RequestMapping("/api/v1")
public class AvisController {

    private final AvisService avisService;

    public AvisController(AvisService avisService) {
        this.avisService = avisService;
    }

    /** Avis publics d'un médecin, avec moyenne et répartition. */
    @GetMapping("/annuaire/medecins/{medecinId}/avis")
    public ResponseEntity<ApiResponse<AvisPageResponse>> listerAvisMedecin(
            @PathVariable UUID medecinId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(avisService.listerAvisMedecin(medecinId, page, size)));
    }

    /**
     * Notes de plusieurs médecins en une requête — les cartes d'une page de recherche.
     *
     * <p>Public comme le reste de l'annuaire, et hors du profil médecin : celui-ci est mis
     * en cache, la note doit rester fraîche.
     */
    @GetMapping("/avis/notes")
    public ResponseEntity<ApiResponse<List<NoteMedecinResponse>>> notesMedecins(
            @RequestParam List<UUID> ids) {
        return ResponseEntity.ok(ApiResponse.ok(avisService.notesParMedecins(ids)));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping("/avis")
    public ResponseEntity<ApiResponse<AvisResponse>> creerAvis(
            JwtAuthenticationToken authentication,
            @Valid @RequestBody CreerAvisRequest request) {
        UUID compteId = compteId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(avisService.creerAvis(compteId, request)));
    }

    /** Parmi les rendez-vous affichés, ceux que l'appelant peut encore noter. */
    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping("/avis/notables")
    public ResponseEntity<ApiResponse<List<UUID>>> rdvsNotables(
            JwtAuthenticationToken authentication,
            @Valid @RequestBody RdvsNotablesRequest request) {
        UUID compteId = compteId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
            avisService.filtrerRdvsNotables(compteId, request.rdvIds())));
    }

    /** Signalement ouvert à tout compte connecté — patient comme médecin visé. */
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/avis/{avisId}/signalement")
    public ResponseEntity<ApiResponse<Void>> signaler(
            JwtAuthenticationToken authentication,
            @PathVariable UUID avisId,
            @Valid @RequestBody(required = false) SignalerAvisRequest request) {
        avisService.signaler(avisId, compteId(authentication), request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/avis/moderation")
    public ResponseEntity<ApiResponse<AvisPageResponse>> fileModeration(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(avisService.listerModeration(page, size)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/avis/{avisId}/moderation")
    public ResponseEntity<ApiResponse<AvisResponse>> moderer(
            @PathVariable UUID avisId,
            @RequestParam StatutAvis statut) {
        return ResponseEntity.ok(ApiResponse.ok(avisService.modererAvis(avisId, statut)));
    }

    private UUID compteId(JwtAuthenticationToken authentication) {
        Jwt jwt = (Jwt) authentication.getCredentials();
        return avisService.compteIdDepuisKeycloak(jwt.getSubject());
    }
}
