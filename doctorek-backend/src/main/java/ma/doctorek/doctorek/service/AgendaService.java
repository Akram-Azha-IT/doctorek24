package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.CreneauResponse;
import ma.doctorek.doctorek.dto.DefineDisponibiliteRequest;
import ma.doctorek.doctorek.dto.DisponibiliteResponse;
import ma.doctorek.doctorek.dto.PatientSummaryResponse;
import ma.doctorek.doctorek.dto.PatientsPageResponse;
import ma.doctorek.doctorek.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.dto.RendezVousResponse;
import ma.doctorek.doctorek.entity.DisponibiliteEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.enums.FrequenceDisponibilite;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.enums.TypeFinRecurrence;
import ma.doctorek.doctorek.exception.CreneauIndisponibleException;
import ma.doctorek.doctorek.exception.DisponibiliteNotFoundException;
import ma.doctorek.doctorek.exception.MedecinSansAgendaException;
import ma.doctorek.doctorek.exception.RdvNonAnnulableException;
import ma.doctorek.doctorek.exception.RdvNonConfirmableException;
import ma.doctorek.doctorek.exception.RdvNonTerminableException;
import ma.doctorek.doctorek.exception.RendezVousNotFoundException;
import ma.doctorek.doctorek.repository.DisponibiliteRepository;
import ma.doctorek.doctorek.repository.PatientSummaryProjection;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AgendaService {

    private static final Logger log = LoggerFactory.getLogger(AgendaService.class);

    private final DisponibiliteRepository dispoRepo;
    private final RendezVousRepository    rdvRepo;
    private final UserRepository          userRepo;
    private final EmailService            emailService;
    private final QuestionnaireSerializer questionnaireSerializer;

    public AgendaService(DisponibiliteRepository dispoRepo,
                          RendezVousRepository rdvRepo,
                          UserRepository userRepo,
                          EmailService emailService,
                          QuestionnaireSerializer questionnaireSerializer) {
        this.dispoRepo = dispoRepo;
        this.rdvRepo = rdvRepo;
        this.userRepo = userRepo;
        this.emailService = emailService;
        this.questionnaireSerializer = questionnaireSerializer;
    }

    @Transactional
    public DisponibiliteResponse defineDisponibilite(UUID medecinId, DefineDisponibiliteRequest req) {
        if (!req.heureDebut().isBefore(req.heureFin())) {
            throw new IllegalArgumentException(
                "L'heure de début doit être antérieure à l'heure de fin");
        }

        String jour = req.jourSemaine().name();
        List<DisponibiliteEntity> existing = dispoRepo.findAllByMedecinIdAndJourSemaine(medecinId, jour);
        for (DisponibiliteEntity dispo : existing) {
            boolean exactMatch = req.heureDebut().equals(dispo.getHeureDebut())
                              && req.heureFin().equals(dispo.getHeureFin());
            if (exactMatch) {
                return DisponibiliteResponse.from(dispo);
            }
            boolean overlaps = req.heureDebut().isBefore(dispo.getHeureFin())
                            && req.heureFin().isAfter(dispo.getHeureDebut());
            if (overlaps) {
                dispoRepo.deleteById(dispo.getId());
            }
        }

        FrequenceDisponibilite frequence = req.frequence() != null
            ? req.frequence()
            : FrequenceDisponibilite.TOUTES_LES_SEMAINES;

        int intervalSemaines = (req.intervalSemaines() != null && req.intervalSemaines() > 0)
            ? req.intervalSemaines()
            : 1;

        LocalDate dateDebut = req.dateDebut() != null ? req.dateDebut() : LocalDate.now();

        TypeFinRecurrence typeFinRecurrence = req.typeFinRecurrence() != null
            ? req.typeFinRecurrence()
            : TypeFinRecurrence.JAMAIS;

        DisponibiliteEntity dispo = new DisponibiliteEntity();
        dispo.setMedecinId(medecinId);
        dispo.setJourSemaine(jour);
        dispo.setHeureDebut(req.heureDebut());
        dispo.setHeureFin(req.heureFin());
        dispo.setDureeConsultation(req.dureeConsultation());
        dispo.setFrequence(frequence.name());
        dispo.setIntervalSemaines(intervalSemaines);
        dispo.setDateDebut(dateDebut);
        dispo.setTypeFinRecurrence(typeFinRecurrence.name());
        dispo.setDateFin(req.dateFin());
        return DisponibiliteResponse.from(dispoRepo.save(dispo));
    }

    @Transactional
    public void deleteDisponibilite(UUID medecinId, UUID dispoId) {
        DisponibiliteEntity dispo = dispoRepo.findById(dispoId)
            .orElseThrow(() -> new DisponibiliteNotFoundException(dispoId));

        if (!dispo.getMedecinId().equals(medecinId)) {
            throw new IllegalArgumentException(
                "Cette disponibilité n'appartient pas au médecin indiqué");
        }
        dispoRepo.deleteById(dispoId);
    }

    @Transactional(readOnly = true)
    public List<DisponibiliteResponse> getDisponibilites(UUID medecinId) {
        return dispoRepo.findByMedecinId(medecinId).stream()
            .map(DisponibiliteResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CreneauResponse> getCreneauxDisponibles(UUID medecinId, LocalDate date) {
        List<DisponibiliteEntity> dispos = dispoRepo.findAllByMedecinIdAndJourSemaine(
            medecinId, date.getDayOfWeek().name());
        if (dispos.isEmpty()) return List.of();

        Set<LocalTime> heuresPrises = rdvRepo.findByMedecinIdAndDateRdv(medecinId, date)
            .stream()
            .filter(r -> !StatutRdv.ANNULE.name().equals(r.getStatut()))
            .map(RendezVousEntity::getHeureRdv)
            .collect(Collectors.toSet());

        List<CreneauResponse> creneaux = new ArrayList<>();
        for (DisponibiliteEntity dispo : dispos) {
            LocalTime current = dispo.getHeureDebut();
            int duree = dispo.getDureeConsultation();
            if (duree <= 0) continue;

            while (true) {
                LocalTime fin = current.plusMinutes(duree);
                if (fin.isBefore(current) && fin != LocalTime.MIDNIGHT) break;
                if (fin.isAfter(dispo.getHeureFin()) && fin != LocalTime.MIDNIGHT) break;

                boolean libre = !heuresPrises.contains(current);
                creneaux.add(new CreneauResponse(current.toString(), fin.toString(), libre));
                current = fin;
                if (current.equals(LocalTime.MIDNIGHT) || current.equals(dispo.getHeureFin())) break;
            }
        }
        creneaux.sort(Comparator.comparing(CreneauResponse::debut));
        return creneaux;
    }

    @Transactional
    public RendezVousResponse prendreRdv(PrendreRdvRequest request) {
        DisponibiliteEntity dispo = dispoRepo
            .findByMedecinIdAndJourSemaine(request.medecinId(), request.dateRdv().getDayOfWeek().name())
            .orElseThrow(() -> new MedecinSansAgendaException(request.medecinId()));

        if (rdvRepo.existsByMedecinIdAndDateRdvAndHeureRdv(
                request.medecinId(), request.dateRdv(), request.heureRdv())) {
            throw new CreneauIndisponibleException(
                "Créneau indisponible : " + request.dateRdv() + " à " + request.heureRdv());
        }

        String questionnaireJson = questionnaireSerializer.serialize(request.questionnaire());

        RendezVousEntity rdv = new RendezVousEntity();
        rdv.setMedecinId(request.medecinId());
        rdv.setPatientId(request.patientId());
        rdv.setDateRdv(request.dateRdv());
        rdv.setHeureRdv(request.heureRdv());
        rdv.setDuree(dispo.getDureeConsultation());
        rdv.setStatut(StatutRdv.CONFIRME.name()); // auto-confirmed — doctor manages via cancel only
        rdv.setMotif(request.motif());
        rdv.setQuestionnaireJson(questionnaireJson);
        rdv.setCreatedAt(LocalDateTime.now());

        RendezVousEntity saved = rdvRepo.save(rdv);

        userRepo.findById(request.patientId()).ifPresentOrElse(
            patient -> emailService.sendConfirmationRdv(patient.getEmail(), saved),
            () -> log.warn("Patient introuvable pour rdv {} — confirmation email non envoyé", saved.getId())
        );

        return RendezVousResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<RendezVousResponse> getRdvsPatient(UUID patientId) {
        return rdvRepo.findByPatientId(patientId, PageRequest.of(0, 200))
            .getContent().stream()
            .map(RendezVousResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<RendezVousResponse> getRdvsMedecin(UUID medecinId) {
        return rdvRepo.findByMedecinId(medecinId, PageRequest.of(0, 500))
            .getContent().stream()
            .map(rdv -> userRepo.findById(rdv.getPatientId())
                .map(u -> RendezVousResponse.from(rdv, u.getFirstName(), u.getLastName()))
                .orElseGet(() -> RendezVousResponse.from(rdv)))
            .toList();
    }

    @Transactional
    public RendezVousResponse annulerRdv(UUID rdvId) {
        RendezVousEntity rdv = rdvRepo.findById(rdvId)
            .orElseThrow(() -> new RendezVousNotFoundException(rdvId));
        StatutRdv statut = StatutRdv.valueOf(rdv.getStatut());
        if (statut == StatutRdv.ANNULE || statut == StatutRdv.TERMINE) {
            throw new RdvNonAnnulableException(rdvId, statut);
        }
        rdv.setStatut(StatutRdv.ANNULE.name());
        return RendezVousResponse.from(rdvRepo.save(rdv));
    }

    @Transactional
    public RendezVousResponse confirmerRdv(UUID rdvId) {
        RendezVousEntity rdv = rdvRepo.findById(rdvId)
            .orElseThrow(() -> new RendezVousNotFoundException(rdvId));
        StatutRdv statut = StatutRdv.valueOf(rdv.getStatut());
        if (statut == StatutRdv.ANNULE || statut == StatutRdv.TERMINE) {
            throw new RdvNonConfirmableException(rdvId, statut);
        }
        rdv.setStatut(StatutRdv.CONFIRME.name());
        return RendezVousResponse.from(rdvRepo.save(rdv));
    }

    @Transactional
    public RendezVousResponse terminerRdv(UUID rdvId) {
        RendezVousEntity rdv = rdvRepo.findById(rdvId)
            .orElseThrow(() -> new RendezVousNotFoundException(rdvId));
        StatutRdv statut = StatutRdv.valueOf(rdv.getStatut());
        if (statut != StatutRdv.CONFIRME) {
            throw new RdvNonTerminableException(rdvId, statut);
        }
        rdv.setStatut(StatutRdv.TERMINE.name());
        return RendezVousResponse.from(rdvRepo.save(rdv));
    }

    @Transactional
    public RendezVousResponse reprogrammerRdv(UUID id, LocalDate newDate, LocalTime newHeure) {
        RendezVousEntity rdv = rdvRepo.findById(id)
            .orElseThrow(() -> new RendezVousNotFoundException(id));

        boolean slotTaken = rdvRepo.findByMedecinIdAndDateRdv(rdv.getMedecinId(), newDate)
            .stream()
            .anyMatch(r -> r.getHeureRdv().equals(newHeure) && !r.getId().equals(id));
        if (slotTaken) {
            throw new IllegalStateException("Ce créneau est déjà pris");
        }

        rdv.setDateRdv(newDate);
        rdv.setHeureRdv(newHeure);
        return RendezVousResponse.from(rdvRepo.save(rdv));
    }

    @Transactional(readOnly = true)
    public PatientsPageResponse getPatientsMedecin(UUID medecinId, String search, String filtre, int page, int size) {
        String s = search == null ? "" : search.trim();
        String f = filtre == null || filtre.isBlank() ? "TOUS" : filtre.toUpperCase();

        List<PatientSummaryProjection> projections = rdvRepo.findPatientsByMedecinId(
            medecinId, s, f, size, page * size);

        List<PatientSummaryResponse> patients = projections.stream()
            .map(p -> new PatientSummaryResponse(
                UUID.fromString(p.getPatientId()),
                p.getFirstName(),
                p.getLastName(),
                p.getDernierRdvDate(),
                p.getDernierRdvStatut() != null ? StatutRdv.valueOf(p.getDernierRdvStatut()) : null,
                p.isHasFutureRdv()))
            .toList();

        long total = rdvRepo.countPatientsByMedecinId(medecinId, s, f);
        return new PatientsPageResponse(patients, total, page, size);
    }
}
