package ma.doctorek.doctorek.carte.infrastructure;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelle;
import ma.doctorek.doctorek.carte.domain.CarteVirtuelleRepository;
import ma.doctorek.doctorek.shared.FieldEncryptionService;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaCarteVirtuelleRepository implements CarteVirtuelleRepository {

    private final SpringDataCarteRepository carteRepo;
    private final SpringDataAuditLogRepository auditRepo;
    private final FieldEncryptionService enc;
    private final ObjectMapper mapper;

    public JpaCarteVirtuelleRepository(SpringDataCarteRepository carteRepo,
                                       SpringDataAuditLogRepository auditRepo,
                                       FieldEncryptionService enc,
                                       ObjectMapper mapper) {
        this.carteRepo = carteRepo;
        this.auditRepo = auditRepo;
        this.enc = enc;
        this.mapper = mapper;
    }

    @Override
    public CarteVirtuelle save(CarteVirtuelle carte) {
        CarteVirtuelleEntity entity = toEntity(carte);
        CarteVirtuelleEntity saved = carteRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<CarteVirtuelle> findByPatientId(UUID patientId) {
        return carteRepo.findByPatientId(patientId).map(this::toDomain);
    }

    @Override
    public Optional<CarteVirtuelle> findByCardRef(String cardRef) {
        return carteRepo.findByCardRef(cardRef).map(this::toDomain);
    }

    @Override
    public boolean existsByPatientId(UUID patientId) {
        return carteRepo.existsByPatientId(patientId);
    }

    @Override
    public void logAudit(UUID cardId, String action, UUID changedBy) {
        AuditLogEntity log = new AuditLogEntity();
        log.setCardId(cardId);
        log.setAction(action);
        log.setChangedBy(changedBy);
        auditRepo.save(log);
    }

    private CarteVirtuelleEntity toEntity(CarteVirtuelle c) {
        CarteVirtuelleEntity e = new CarteVirtuelleEntity();
        e.setId(c.id());
        e.setPatientId(c.patientId());
        e.setCardRef(c.cardRef());
        e.setStatut(c.statut());
        e.setDateNaissance(c.dateNaissance());
        e.setGenre(c.genre());
        e.setNationalite(c.nationalite());
        e.setNumIdentite(enc.encrypt(c.numIdentite()));
        e.setPhotoUrl(c.photoUrl());
        e.setTelephone(c.telephone());
        e.setAdresseRue(c.adresseRue());
        e.setAdresseVille(c.adresseVille());
        e.setAdressePays(c.adressePays());
        e.setGroupeSanguin(c.groupeSanguin());
        e.setTailleCm(c.tailleCm());
        e.setPoidsKg(c.poidsKg());
        e.setDonneurOrganes(c.donneurOrganes());
        e.setAllergies(enc.encrypt(toJson(c.allergies())));
        e.setMaladiesChroniques(enc.encrypt(toJson(c.maladiesChroniques())));
        e.setMedicamentsActuels(enc.encrypt(toJson(c.medicamentsActuels())));
        e.setAntecedentsChirurgicaux(enc.encrypt(toJson(c.antecedentsChirurgicaux())));
        e.setVaccinations(enc.encrypt(toJson(c.vaccinations())));
        e.setAntecedentsFamiliaux(enc.encrypt(toJson(c.antecedentsFamiliaux())));
        e.setContactsUrgence(enc.encrypt(toJson(c.contactsUrgence())));
        e.setMedecinTraitant(enc.encrypt(c.medecinTraitant()));
        e.setAssuranceNom(c.assuranceNom());
        e.setAssuranceNumero(enc.encrypt(c.assuranceNumero()));
        e.setAssuranceDetails(enc.encrypt(c.assuranceDetails()));
        return e;
    }

    private CarteVirtuelle toDomain(CarteVirtuelleEntity e) {
        return new CarteVirtuelle(
                e.getId(),
                e.getPatientId(),
                e.getCardRef(),
                e.getStatut(),
                e.getDateNaissance(),
                e.getGenre(),
                e.getNationalite(),
                enc.decrypt(e.getNumIdentite()),
                e.getPhotoUrl(),
                e.getTelephone(),
                e.getAdresseRue(),
                e.getAdresseVille(),
                e.getAdressePays(),
                e.getGroupeSanguin(),
                e.getTailleCm(),
                e.getPoidsKg(),
                e.getDonneurOrganes(),
                fromJson(enc.decrypt(e.getAllergies()), new TypeReference<List<String>>() {}),
                fromJson(enc.decrypt(e.getMaladiesChroniques()), new TypeReference<List<String>>() {}),
                fromJson(enc.decrypt(e.getMedicamentsActuels()), new TypeReference<List<CarteVirtuelle.MedicamentActuel>>() {}),
                fromJson(enc.decrypt(e.getAntecedentsChirurgicaux()), new TypeReference<List<CarteVirtuelle.AntecedentChirurgical>>() {}),
                fromJson(enc.decrypt(e.getVaccinations()), new TypeReference<List<String>>() {}),
                fromJson(enc.decrypt(e.getAntecedentsFamiliaux()), new TypeReference<List<String>>() {}),
                fromJson(enc.decrypt(e.getContactsUrgence()), new TypeReference<List<CarteVirtuelle.ContactUrgence>>() {}),
                enc.decrypt(e.getMedecinTraitant()),
                e.getAssuranceNom(),
                enc.decrypt(e.getAssuranceNumero()),
                enc.decrypt(e.getAssuranceDetails()),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception ex) {
            throw new RuntimeException("JSON serialization failed", ex);
        }
    }

    private <T> T fromJson(String json, TypeReference<T> ref) {
        if (json == null) return null;
        try {
            return mapper.readValue(json, ref);
        } catch (Exception ex) {
            throw new RuntimeException("JSON deserialization failed", ex);
        }
    }
}
