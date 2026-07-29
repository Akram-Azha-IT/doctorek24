package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.ListeAttenteResponse;
import ma.doctorek.doctorek.entity.ListeAttenteEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.ListeAttenteInvalideException;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.ListeAttenteRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Liste d'attente : prévenir les patients quand une place se libère.
 *
 * <p>Attribution au premier arrivé. Tous les candidats sont prévenus en même temps
 * et le créneau revient à celui qui réserve le premier ; rien n'est bloqué d'avance.
 * C'est ce qui remplit le plus vite, ce qui compte quand l'annulation tombe la veille.
 */
@Service
public class ListeAttenteService {

    private static final Logger log = LoggerFactory.getLogger(ListeAttenteService.class);

    /** Au-delà, une inscription couvrirait l'agenda entier et perdrait son sens. */
    private static final int PLAGE_MAX_JOURS = 90;

    private static final String STATUT_ACTIVE = "ACTIVE";

    private final ListeAttenteRepository repo;
    private final UserRepository userRepo;
    private final AccesPatientService accesPatientService;
    private final NotificationService notificationService;
    private final NotificationRoutingService notificationRouting;
    private final EmailService emailService;
    private final ZoneId zone;

    public ListeAttenteService(ListeAttenteRepository repo,
            UserRepository userRepo,
            AccesPatientService accesPatientService,
            NotificationService notificationService,
            NotificationRoutingService notificationRouting,
            EmailService emailService,
            ZoneId zoneApplication) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.accesPatientService = accesPatientService;
        this.notificationService = notificationService;
        this.notificationRouting = notificationRouting;
        this.emailService = emailService;
        this.zone = zoneApplication;
    }

    @Transactional
    public ListeAttenteResponse inscrire(UUID medecinId, UUID patientId, UUID requesterUserId,
            LocalDate dateDebut, LocalDate dateFin) {
        accesPatientService.verifierAcces(requesterUserId, patientId);
        validerPlage(dateDebut, dateFin);

        // Réinscription : on réutilise l'entrée existante plutôt que d'en créer une
        // seconde, que l'index unique partiel refuserait de toute façon.
        ListeAttenteEntity entity = repo
            .findByMedecinIdAndPatientIdAndStatut(medecinId, patientId, STATUT_ACTIVE)
            .orElseGet(ListeAttenteEntity::new);

        entity.setMedecinId(medecinId);
        entity.setPatientId(patientId);
        entity.setCreePar(requesterUserId);
        entity.setDateDebut(dateDebut);
        entity.setDateFin(dateFin);
        entity.setStatut(STATUT_ACTIVE);

        return ListeAttenteResponse.from(repo.save(entity));
    }

    private void validerPlage(LocalDate dateDebut, LocalDate dateFin) {
        LocalDate aujourdhui = LocalDate.now(zone);
        if (dateDebut == null || dateFin == null) {
            throw new ListeAttenteInvalideException("Les deux dates de la plage sont requises.");
        }
        if (dateFin.isBefore(dateDebut)) {
            throw new ListeAttenteInvalideException("La date de fin précède la date de début.");
        }
        if (dateFin.isBefore(aujourdhui)) {
            throw new ListeAttenteInvalideException("La plage demandée est déjà passée.");
        }
        if (dateDebut.plusDays(PLAGE_MAX_JOURS).isBefore(dateFin)) {
            throw new ListeAttenteInvalideException(
                "La plage ne peut pas dépasser " + PLAGE_MAX_JOURS + " jours.");
        }
    }

    @Transactional(readOnly = true)
    public List<ListeAttenteResponse> listerPourPatient(UUID patientId, UUID requesterUserId) {
        accesPatientService.verifierAcces(requesterUserId, patientId);
        return repo.findByPatientIdAndStatutOrderByCreatedAtDesc(patientId, STATUT_ACTIVE)
            .stream().map(ListeAttenteResponse::from).toList();
    }

    @Transactional
    public void desinscrire(UUID inscriptionId, UUID requesterUserId) {
        ListeAttenteEntity entity = repo.findById(inscriptionId)
            .orElseThrow(() -> new ListeAttenteInvalideException("Inscription introuvable."));
        accesPatientService.verifierAcces(requesterUserId, entity.getPatientId());
        entity.setStatut("ANNULEE");
        repo.save(entity);
    }

    /** Clôt l'attente du patient chez ce médecin dès qu'il décroche une place. */
    @Transactional
    public void marquerServie(UUID medecinId, UUID patientId) {
        repo.findByMedecinIdAndPatientIdAndStatut(medecinId, patientId, STATUT_ACTIVE)
            .ifPresent(e -> {
                e.setStatut("SERVIE");
                repo.save(e);
            });
    }

    /**
     * Prévient les patients en attente qu'une place s'est libérée.
     *
     * <p>Ne doit jamais faire échouer l'annulation qui la déclenche : le patient a
     * annulé, c'est acquis, un incident de notification ne peut pas revenir dessus.
     */
    @Transactional
    public void notifierCreneauLibere(RendezVousEntity annule) {
        List<ListeAttenteEntity> candidats =
            repo.findCandidats(annule.getMedecinId(), annule.getDateRdv(), annule.getPatientId());
        if (candidats.isEmpty()) return;

        String medecinNom = userRepo.findById(annule.getMedecinId())
            .map(u -> "Dr. " + u.getFirstName() + " " + u.getLastName())
            .orElse("votre médecin");

        Instant maintenant = Instant.now();
        for (ListeAttenteEntity candidat : candidats) {
            try {
                prevenir(candidat, annule, medecinNom);
                candidat.setDerniereNotificationAt(maintenant);
                repo.save(candidat);
            } catch (Exception e) {
                log.warn("Liste d'attente : patient {} non prévenu pour le {} : {}",
                    candidat.getPatientId(), annule.getDateRdv(), e.getMessage());
            }
        }
        log.info("Liste d'attente : {} patient(s) prévenu(s) du créneau {} {}",
            candidats.size(), annule.getDateRdv(), annule.getHeureRdv());
    }

    private void prevenir(ListeAttenteEntity candidat, RendezVousEntity annule, String medecinNom) {
        String corps = "Une place vient de se libérer chez " + medecinNom
            + " le " + annule.getDateRdv() + " à " + annule.getHeureRdv()
            + ". Premier arrivé, premier servi.";

        notificationRouting.resolveCompteUserId(candidat.getPatientId()).ifPresent(userId ->
            notificationService.push(userId, "PLACE_LIBEREE", "Une place s'est libérée", corps));

        notificationRouting.resolveEmail(candidat.getPatientId()).ifPresent(email ->
            emailService.sendPlaceLiberee(email, annule, medecinNom));
    }
}
