package ma.doctorek.doctorek.notification;

import ma.doctorek.doctorek.entity.PatientDetailEntity;
import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.repository.PatientDetailRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
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

    public NotificationService(NotificationRepository repo,
                                SimpMessagingTemplate stomp,
                                RendezVousRepository rdvRepo,
                                PatientDetailRepository patientDetailRepo,
                                UserRepository userRepo) {
        this.repo              = repo;
        this.stomp             = stomp;
        this.rdvRepo           = rdvRepo;
        this.patientDetailRepo = patientDetailRepo;
        this.userRepo          = userRepo;
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

    @Transactional
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

    @Scheduled(cron = "0 * * * * *") // every minute
    @Transactional
    public void sendRdvReminders() {
        LocalDate today = LocalDate.now();
        LocalTime now   = LocalTime.now();
        LocalTime windowStart = now.plusMinutes(28);
        LocalTime windowEnd   = now.plusMinutes(32);

        if (windowStart.isAfter(windowEnd)) return; // midnight edge case

        rdvRepo.findByDateRdvAndStatutNot(today, "ANNULE")
                .stream()
                .filter(rdv -> rdv.getHeureRdv() != null
                        && !rdv.getHeureRdv().isBefore(windowStart)
                        && !rdv.getHeureRdv().isAfter(windowEnd))
                .forEach(rdv -> pushRdvReminder(rdv));
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
            push(rdv.getPatientId(),
                    "RDV_RAPPEL",
                    "Rappel : rendez-vous dans 30 minutes",
                    "Votre consultation avec " + medecinNom + " est prévue à " + rdv.getHeureRdv() + ".");
        });
    }
}
