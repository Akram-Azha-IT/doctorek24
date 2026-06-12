package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.stream.Stream;

@Component
public class RappelScheduler {

    private static final Logger log = LoggerFactory.getLogger(RappelScheduler.class);

    private final RendezVousRepository rdvRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;

    public RappelScheduler(RendezVousRepository rdvRepo,
            UserRepository userRepo,
            EmailService emailService) {
        this.rdvRepo = rdvRepo;
        this.userRepo = userRepo;
        this.emailService = emailService;
    }

    // @Transactional here (not on the helper) — self-invocation bypasses the
    // proxy, so the helper's annotation would never apply. Streaming needs an
    // open tx/session across the whole forEach.
    @Scheduled(cron = "${doctorek.mail.rappel-cron:0 0 8 * * *}")
    @Transactional(readOnly = true)
    public void envoyerRappelsQuotidiens() {
        LocalDate today = LocalDate.now();
        envoyerRappelsPourDate(today.plusDays(1), 1);
        envoyerRappelsPourDate(today.plusDays(2), 2);
    }

    private void envoyerRappelsPourDate(LocalDate date, int joursAvant) {
        try (Stream<RendezVousEntity> rdvs = rdvRepo.streamByDateRdvAndStatutNot(date, StatutRdv.ANNULE.name())) {
            rdvs.forEach(rdv -> userRepo.findById(rdv.getPatientId())
                    .ifPresentOrElse(
                            patient -> emailService.sendRappelRdv(patient.getEmail(), rdv, joursAvant),
                            () -> log.warn("Patient introuvable pour rdv {}, rappel J-{} non envoyé",
                                    rdv.getId(), joursAvant)));
        }
        log.info("Rappels J-{} traités pour le {}", joursAvant, date);
    }
}
