package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.stream.Stream;

@Component
public class RappelScheduler {

    private static final Logger log = LoggerFactory.getLogger(RappelScheduler.class);

    private final RendezVousRepository rdvRepo;
    private final EmailService emailService;
    private final NotificationRoutingService notificationRouting;
    private final ZoneId zone;

    public RappelScheduler(RendezVousRepository rdvRepo,
            EmailService emailService,
            NotificationRoutingService notificationRouting,
            ZoneId zoneApplication) {
        this.rdvRepo = rdvRepo;
        this.emailService = emailService;
        this.notificationRouting = notificationRouting;
        this.zone = zoneApplication;
    }

    // @Transactional here (not on the helper) — self-invocation bypasses the
    // proxy, so the helper's annotation would never apply. Streaming needs an
    // open tx/session across the whole forEach.
    @Scheduled(cron = "${doctorek.mail.rappel-cron:0 0 8 * * *}", zone = "${doctorek.timezone:Africa/Casablanca}")
    @Transactional(readOnly = true)
    public void envoyerRappelsQuotidiens() {
        LocalDate today = LocalDate.now(zone);
        envoyerRappelsPourDate(today.plusDays(1), 1);
        envoyerRappelsPourDate(today.plusDays(2), 2);
    }

    private void envoyerRappelsPourDate(LocalDate date, int joursAvant) {
        try (Stream<RendezVousEntity> rdvs = rdvRepo.streamByDateRdvAndStatutNot(date, StatutRdv.ANNULE.name())) {
            rdvs.forEach(rdv -> notificationRouting.resolveEmail(rdv.getPatientId())
                    .ifPresentOrElse(
                            email -> emailService.sendRappelRdv(email, rdv, joursAvant),
                            () -> log.warn("Aucun destinataire pour rdv {}, rappel J-{} non envoyé",
                                    rdv.getId(), joursAvant)));
        }
        log.info("Rappels J-{} traités pour le {}", joursAvant, date);
    }
}
