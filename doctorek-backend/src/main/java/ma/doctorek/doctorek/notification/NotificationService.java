package ma.doctorek.doctorek.notification;

import ma.doctorek.doctorek.entity.PatientDetailEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.repository.PatientDetailRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import ma.doctorek.doctorek.service.EmailService;
import ma.doctorek.doctorek.service.NotificationRoutingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repo;
    private final SimpMessagingTemplate stomp;
    private final RendezVousRepository rdvRepo;
    private final PatientDetailRepository patientDetailRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final NotificationRoutingService notificationRouting;
    private final RappelRdvRegistre rappelRegistre;

    public NotificationService(NotificationRepository repo,
                                SimpMessagingTemplate stomp,
                                RendezVousRepository rdvRepo,
                                PatientDetailRepository patientDetailRepo,
                                UserRepository userRepo,
                                EmailService emailService,
                                NotificationRoutingService notificationRouting,
                                RappelRdvRegistre rappelRegistre) {
        this.repo              = repo;
        this.stomp             = stomp;
        this.rdvRepo           = rdvRepo;
        this.patientDetailRepo = patientDetailRepo;
        this.userRepo          = userRepo;
        this.emailService      = emailService;
        this.notificationRouting = notificationRouting;
        this.rappelRegistre    = rappelRegistre;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 50))
                .stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return repo.countUnread(userId);
    }

    @Transactional
    public void markRead(UUID notifId, UUID userId) {
        repo.markRead(notifId, userId);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        repo.markAllRead(userId);
    }

    // ── Push helpers (called by other services) ──────────────────────────────

    public void push(UUID userId, String type, String title, String body) {
        push(userId, type, title, body, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void push(UUID userId, String type, String title, String body, String data) {
        NotificationEntity n = new NotificationEntity();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setData(data);
        repo.save(n);

        // Deliver real-time via STOMP — principal name = email
        userRepo.findById(userId).ifPresent(user ->
            stomp.convertAndSendToUser(user.getEmail(), "/queue/notifications",
                    NotificationResponse.from(n))
        );
    }

    // ── Scheduled: RDV reminder 30 min before ────────────────────────────────

    /** Délai annoncé au patient dans le rappel. */
    private static final int RAPPEL_AVANT_MINUTES = 30;

    /**
     * Marge de rattrapage en amont de l'échéance.
     *
     * <p>Un tick peut être manqué (redémarrage, pause GC) : la fenêtre reste plus large
     * qu'une minute pour ne pas perdre le rappel. Le doublon est écarté par
     * {@link RappelRdvRegistre}, pas en resserrant la fenêtre.
     */
    private static final int RAPPEL_RATTRAPAGE_MINUTES = 4;

    @Scheduled(cron = "0 * * * * *") // every minute
    public void sendRdvReminders() {
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime cible = maintenant.plusMinutes(RAPPEL_AVANT_MINUTES);
        LocalDateTime debut = cible.minusMinutes(RAPPEL_RATTRAPAGE_MINUTES);

        // La fenêtre franchit minuit pour les consultations de tout début de matinée.
        rdvRepo.findRappelsEnAttente(debut.toLocalDate(), cible.toLocalDate(), "ANNULE")
                .stream()
                .filter(rdv -> rdv.getHeureRdv() != null)
                .filter(rdv -> {
                    LocalDateTime debutRdv = LocalDateTime.of(rdv.getDateRdv(), rdv.getHeureRdv());
                    return !debutRdv.isBefore(debut) && !debutRdv.isAfter(cible);
                })
                .filter(rdv -> rappelRegistre.reserver(rdv.getId()))
                .forEach(this::pushRdvReminder);
    }

    // ── Scheduled: birthday notifications (daily at 08:00) ───────────────────

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendBirthdayNotifications() {
        LocalDate today = LocalDate.now();
        patientDetailRepo.findByBirthMonthAndDay(today.getMonthValue(), today.getDayOfMonth())
                .forEach(p -> push(
                        p.getUserId(),
                        "ANNIVERSAIRE",
                        "Joyeux anniversaire ! 🎂",
                        "L'équipe Doctorek vous souhaite un joyeux anniversaire et une excellente santé."
                ));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void pushRdvReminder(RendezVousEntity rdv) {
        userRepo.findById(rdv.getMedecinId()).ifPresent(medecin -> {
            String medecinNom = "Dr. " + medecin.getFirstName() + " " + medecin.getLastName();

            // Compte famille : notif in-app vers le compte du patient s'il en a un,
            // sinon vers son gestionnaire (proche sans compte)
            notificationRouting.resolveCompteUserId(rdv.getPatientId()).ifPresent(userId ->
                    push(userId,
                            "RDV_RAPPEL",
                            "Rappel : rendez-vous dans 30 minutes",
                            "Consultation avec " + medecinNom + " prévue à " + rdv.getHeureRdv() + "."));

            // Rappel aussi par email — le patient n'a pas forcément l'app ouverte
            notificationRouting.resolveEmail(rdv.getPatientId()).ifPresent(email ->
                    emailService.sendRappelRdv30Min(email, rdv, medecinNom));
        });
    }
}
