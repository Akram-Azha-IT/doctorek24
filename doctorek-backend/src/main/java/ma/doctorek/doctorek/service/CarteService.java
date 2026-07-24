package ma.doctorek.doctorek.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.dto.AntecedentChirurgicalDto;
import ma.doctorek.doctorek.dto.CartePublicResponse;
import ma.doctorek.doctorek.dto.CarteSensibleResponse;
import ma.doctorek.doctorek.dto.CarteVirtuelleRequest;
import ma.doctorek.doctorek.dto.CarteVirtuelleResponse;
import ma.doctorek.doctorek.dto.ContactUrgenceDto;
import ma.doctorek.doctorek.dto.MedicamentActuelDto;
import ma.doctorek.doctorek.entity.AuditLogEntity;
import ma.doctorek.doctorek.entity.CarteVirtuelleEntity;
import ma.doctorek.doctorek.exception.CarteNotFoundException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.AuditLogRepository;
import ma.doctorek.doctorek.repository.CarteVirtuelleRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Year;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class CarteService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final CarteVirtuelleRepository carteRepository;
    private final AuditLogRepository auditRepository;
    private final UserRepository userRepository;
    private final NotificationService notifService;

    public CarteService(CarteVirtuelleRepository carteRepository,
                         AuditLogRepository auditRepository,
                         UserRepository userRepository,
                         NotificationService notifService) {
        this.carteRepository = carteRepository;
        this.auditRepository = auditRepository;
        this.userRepository  = userRepository;
        this.notifService    = notifService;
    }

    @Transactional
    public CarteVirtuelleResponse create(CarteVirtuelleRequest req, UUID patientId) {
        CarteVirtuelleEntity carte = new CarteVirtuelleEntity();
        carte.setPatientId(patientId);
        carte.setCardRef(generateCardRef());
        carte.setStatut("VIRTUEL");
        applyRequest(carte, req);

        CarteVirtuelleEntity saved = carteRepository.save(carte);
        logAudit(saved.getId(), "CREATE", patientId);
        try {
            notifService.push(patientId, "CARTE_CREEE",
                    "Carte médicale créée",
                    "Votre carte médicale virtuelle Doctorek est prête. Partagez-la avec vos médecins.");
        } catch (Exception e) {
            // Notification failure must never roll back the carte creation
        }
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CarteVirtuelleResponse getByPatientId(UUID patientId) {
        CarteVirtuelleEntity carte = carteRepository.findByPatientId(patientId)
            .orElseThrow(() -> new CarteNotFoundException("Carte non trouvée pour patient: " + patientId));
        return toResponse(carte);
    }

    @Transactional(readOnly = true)
    public boolean existsByPatientId(UUID patientId) {
        return carteRepository.existsByPatientId(patientId);
    }

    @Transactional(readOnly = true)
    public CarteVirtuelleResponse getByCardRef(String cardRef) {
        return toResponse(findByRef(cardRef));
    }

    /** Sous-ensemble d'urgence, exposé au scan public du QR (jamais de données sensibles). */
    @Transactional(readOnly = true)
    public CartePublicResponse getPublicByCardRef(String cardRef) {
        CarteVirtuelleEntity e = findByRef(cardRef);
        String[] names = patientNames(e.getPatientId());
        return new CartePublicResponse(
            e.getId(), e.getPatientId(), e.getCardRef(), e.getStatut(),
            names[0], names[1], e.getGroupeSanguin(), e.getTailleCm(), e.getPoidsKg(),
            e.getDonneurOrganes(),
            fromJsonList(e.getAllergies(), new TypeReference<List<String>>() {}),
            fromJsonList(e.getMaladiesChroniques(), new TypeReference<List<String>>() {}),
            fromJsonList(e.getContactsUrgence(), new TypeReference<List<ContactUrgenceDto>>() {}),
            e.getCreatedAt(), e.getUpdatedAt());
    }

    /** Partie sensible, servie seulement après OTP validé (appelée par CarteAccessService). */
    @Transactional(readOnly = true)
    public CarteSensibleResponse getSensibleByCardRef(String cardRef) {
        CarteVirtuelleEntity e = findByRef(cardRef);
        return new CarteSensibleResponse(
            fromJsonList(e.getMedicamentsActuels(), new TypeReference<List<MedicamentActuelDto>>() {}),
            fromJsonList(e.getAntecedentsChirurgicaux(), new TypeReference<List<AntecedentChirurgicalDto>>() {}),
            fromJsonList(e.getVaccinations(), new TypeReference<List<String>>() {}),
            fromJsonList(e.getAntecedentsFamiliaux(), new TypeReference<List<String>>() {}),
            e.getMedecinTraitant(), e.getAssuranceNom(), e.getAssuranceNumero(), e.getAssuranceDetails());
    }

    /** Destinataire de l'OTP : le patient propriétaire de la carte, jamais le scanneur. */
    @Transactional(readOnly = true)
    public OtpTarget getOtpTargetByCardRef(String cardRef) {
        CarteVirtuelleEntity e = findByRef(cardRef);
        return userRepository.findById(e.getPatientId())
            .map(u -> new OtpTarget(e.getPatientId(), u.getEmail(), u.getFirstName()))
            .orElseThrow(() -> new CarteNotFoundException("Patient introuvable pour carte: " + cardRef));
    }

    public record OtpTarget(UUID patientId, String email, String firstName) {}

    /** Résout le patient propriétaire d'une carte (pour l'accès dossier OTP). */
    @Transactional(readOnly = true)
    public UUID getPatientIdByCardRef(String cardRef) {
        return findByRef(cardRef).getPatientId();
    }

    private CarteVirtuelleEntity findByRef(String cardRef) {
        return carteRepository.findByCardRef(cardRef)
            .orElseThrow(() -> new CarteNotFoundException("Carte non trouvée: " + cardRef));
    }

    private String[] patientNames(UUID patientId) {
        return userRepository.findById(patientId)
            .map(u -> new String[]{u.getFirstName(), u.getLastName()})
            .orElse(new String[]{null, null});
    }

    @Transactional
    public CarteVirtuelleResponse update(UUID patientId, CarteVirtuelleRequest req) {
        CarteVirtuelleEntity existing = carteRepository.findByPatientId(patientId)
            .orElseThrow(() -> new CarteNotFoundException("Carte non trouvée pour patient: " + patientId));
        applyRequest(existing, req);
        CarteVirtuelleEntity saved = carteRepository.save(existing);
        logAudit(saved.getId(), "UPDATE", patientId);
        return toResponse(saved);
    }

    private void applyRequest(CarteVirtuelleEntity e, CarteVirtuelleRequest req) {
        e.setGroupeSanguin(req.groupeSanguin());
        e.setTailleCm(req.tailleCm());
        e.setPoidsKg(req.poidsKg());
        e.setDonneurOrganes(req.donneurOrganes() != null ? req.donneurOrganes() : false);
        e.setAllergies(toJson(req.allergies()));
        e.setMaladiesChroniques(toJson(req.maladiesChroniques()));
        e.setMedicamentsActuels(toJson(req.medicamentsActuels()));
        e.setAntecedentsChirurgicaux(toJson(req.antecedentsChirurgicaux()));
        e.setVaccinations(toJson(req.vaccinations()));
        e.setAntecedentsFamiliaux(toJson(req.antecedentsFamiliaux()));
        e.setContactsUrgence(toJson(req.contactsUrgence()));
        e.setMedecinTraitant(req.medecinTraitant());
        e.setAssuranceNom(req.assuranceNom());
        e.setAssuranceNumero(req.assuranceNumero());
        e.setAssuranceDetails(req.assuranceDetails());
    }

    private void logAudit(UUID cardId, String action, UUID changedBy) {
        AuditLogEntity log = new AuditLogEntity();
        log.setCardId(cardId);
        log.setAction(action);
        log.setChangedBy(changedBy);
        auditRepository.save(log);
    }

    private CarteVirtuelleResponse toResponse(CarteVirtuelleEntity e) {
        String[] names = patientNames(e.getPatientId());

        return new CarteVirtuelleResponse(
            e.getId(),
            e.getPatientId(),
            e.getCardRef(),
            e.getStatut(),
            names[0],
            names[1],
            e.getGroupeSanguin(),
            e.getTailleCm(),
            e.getPoidsKg(),
            e.getDonneurOrganes(),
            fromJsonList(e.getAllergies(), new TypeReference<List<String>>() {}),
            fromJsonList(e.getMaladiesChroniques(), new TypeReference<List<String>>() {}),
            fromJsonList(e.getMedicamentsActuels(), new TypeReference<List<MedicamentActuelDto>>() {}),
            fromJsonList(e.getAntecedentsChirurgicaux(), new TypeReference<List<AntecedentChirurgicalDto>>() {}),
            fromJsonList(e.getVaccinations(), new TypeReference<List<String>>() {}),
            fromJsonList(e.getAntecedentsFamiliaux(), new TypeReference<List<String>>() {}),
            fromJsonList(e.getContactsUrgence(), new TypeReference<List<ContactUrgenceDto>>() {}),
            e.getMedecinTraitant(),
            e.getAssuranceNom(),
            e.getAssuranceNumero(),
            e.getAssuranceDetails(),
            e.getCreatedAt(),
            e.getUpdatedAt()
        );
    }

    private String toJson(Object value) {
        if (value == null) return "[]";
        try {
            return MAPPER.writeValueAsString(value);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private <T> List<T> fromJsonList(String json, TypeReference<List<T>> ref) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return MAPPER.readValue(json, ref);
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String generateCardRef() {
        byte[] bytes = new byte[4];
        new SecureRandom().nextBytes(bytes);
        String hex = HexFormat.of().formatHex(bytes).toUpperCase();
        return "VMC-" + Year.now().getValue() + "-" + hex;
    }
}
