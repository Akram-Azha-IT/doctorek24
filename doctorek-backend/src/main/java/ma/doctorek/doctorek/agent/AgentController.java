package ma.doctorek.doctorek.agent;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import ma.doctorek.doctorek.agent.dto.AgentChatRequest;
import ma.doctorek.doctorek.agent.dto.AgentChatResponse;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * Assistant conversationnel du patient.
 *
 * <p>Endpoint authentifié : il n'y a pas d'usage anonyme en v1, et le quota
 * anti-flood comme l'accès aux rendez-vous supposent un patient identifié.
 * L'identifiant est résolu ici depuis le jeton Keycloak, puis transmis au
 * service — il n'est jamais lu dans le corps de la requête.
 */
@RestController
@RequestMapping("/api/v1/agent")
@Tag(name = "Agent", description = "Assistant conversationnel : recherche de médecins, créneaux, préparation de rendez-vous")
public class AgentController {

    private final AgentService agentService;
    private final UserRepository userRepository;

    public AgentController(AgentService agentService, UserRepository userRepository) {
        this.agentService = agentService;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping("/chat")
    @Operation(summary = "Pose une question à l'assistant",
               description = "Renvoie une phrase de synthèse et les blocs de données à afficher. "
                       + "Aucune écriture : une prise de rendez-vous reste confirmée par le patient.")
    public ResponseEntity<ApiResponse<AgentChatResponse>> chat(
            Principal principal,
            @Valid @RequestBody AgentChatRequest request) {
        UUID patientId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.ok(agentService.repondre(patientId, request)));
    }

    @GetMapping("/statut")
    @Operation(summary = "Indique si l'assistant est configuré",
               description = "Permet au frontend de masquer l'entrée de l'assistant quand aucun modèle n'est branché.")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> statut() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("disponible", agentService.estDisponible())));
    }

    private UUID resolveUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .map(User::getId)
                .orElseThrow(() -> new UserNotFoundException(principal.getName()));
    }
}
