package ma.doctorek.doctorek.notification;

import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class RappelScheduler {

    private static final Logger log = LoggerFactory.getLogger(RappelScheduler.class);

    private final RendezVousRepository rdvRepo;
    private final UserRepository       userRepo;
    private final EmailService         emailService;

    public RappelScheduler(RendezVousRepository rdvRepo,
                           UserRepository userRepo,
                           EmailService emailService) {
        this.rdvRepo      = rdvRepo;
        this.userRepo     = userRepo;
        this.emailService = emailService;
    }

    @Scheduled(cron = "${doctorek.mail.rappel-cron:0 0 8 * * *}")
    public void envoyerRappelsQuotidiens() {
        LocalDate today = LocalDate.now();
        envoyerRappelsPourDate(today.plusDays(1), 1);
        envoyerRappelsPourDate(today.plusDays(2), 2);
    }

    private void envoyerRappelsPourDate(LocalDate date, int joursAvant) {
        List<RendezVous> rdvs = rdvRepo.findByDateAndStatutNot(date, StatutRdv.ANNULE);
        log.info("Rappel J-{} : {} rendez-vous à traiter pour le {}", joursAvant, rdvs.size(), date);

        for (RendezVous rdv : rdvs) {
            userRepo.findById(rdv.patientId())
                .ifPresentOrElse(
                    patient -> emailService.sendRappelRdv(patient.getEmail(), rdv, joursAvant),
                    () -> log.warn("Patient introuvable pour rdv {} — rappel J-{} non envoyé",
                                   rdv.id(), joursAvant)
                );
        }
    }
}
