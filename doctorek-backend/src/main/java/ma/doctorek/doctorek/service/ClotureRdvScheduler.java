package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import ma.doctorek.doctorek.enums.StatutRdv;
import ma.doctorek.doctorek.notification.NotificationService;
import ma.doctorek.doctorek.repository.AvisRepository;
import ma.doctorek.doctorek.repository.RendezVousRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Clôture des consultations passées, et invitation du patient à les noter.
 *
 * <p>Le passage à {@code TERMINE} dépendait d'un clic du médecin. En consultation, ce clic
 * n'arrive pas : les rendez-vous restaient {@code CONFIRME} indéfiniment et aucun avis
 * n'était possible. L'heure écoulée fait donc foi.
 *
 * <p>La clôture suit la fin du créneau réservé, pas son début : un rendez-vous de 14 h 00
 * d'une demi-heure se clôt à 14 h 30, sinon le patient serait invité à noter alors qu'il
 * est encore dans le cabinet.
 *
 * <p>Une consultation close n'est pas une consultation honorée — rien ici ne prouve que le
 * patient s'est présenté. C'est le prix à payer pour que la boucle d'avis existe ; le
 * médecin garde l'annulation pour écarter un rendez-vous non honoré.
 */
@Component
public class ClotureRdvScheduler {

    private static final Logger log = LoggerFactory.getLogger(ClotureRdvScheduler.class);

    /** Statuts encore ouverts : un rendez-vous annulé ou déjà terminé n'est pas concerné. */
    private static final List<String> STATUTS_OUVERTS =
        List.of(StatutRdv.EN_ATTENTE.name(), StatutRdv.CONFIRME.name());

    private final RendezVousRepository rdvRepo;
    private final AvisRepository avisRepo;
    private final UserRepository userRepo;
    private final NotificationService notifications;
    private final NotificationRoutingService notificationRouting;
    private final ZoneId zone;

    /**
     * Marge supplémentaire après la fin du créneau.
     *
     * <p>Zéro par défaut : le créneau réservé porte déjà sa durée, une consultation de
     * 30 min se clôt donc 30 min après son début, pas à son début. Une marge ne se
     * justifie que si les praticiens débordent systématiquement.
     */
    @Value("${doctorek.rdv.cloture-marge-minutes:0}")
    private int margeClotureMinutes;

    public ClotureRdvScheduler(RendezVousRepository rdvRepo,
                               AvisRepository avisRepo,
                               UserRepository userRepo,
                               NotificationService notifications,
                               NotificationRoutingService notificationRouting,
                               ZoneId zoneApplication) {
        this.rdvRepo = rdvRepo;
        this.avisRepo = avisRepo;
        this.userRepo = userRepo;
        this.notifications = notifications;
        this.notificationRouting = notificationRouting;
        this.zone = zoneApplication;
    }

    /**
     * Clôture les rendez-vous dont le créneau est écoulé.
     *
     * <p>Passage à la minute : le patient qui sort de consultation doit voir « Terminé »
     * et pouvoir noter tout de suite, pas à la prochaine heure ronde.
     */
    @Scheduled(cron = "${doctorek.rdv.cloture-cron:0 * * * * *}", zone = "${doctorek.timezone:Africa/Casablanca}")
    @Transactional
    public void cloturerRdvsPasses() {
        LocalDateTime maintenant = LocalDateTime.now(zone);

        // La requête ramène les créneaux commencés ; la fin se calcule ici, la durée
        // étant portée par chaque rendez-vous.
        List<RendezVousEntity> aCloturer = rdvRepo
            .findACloturer(STATUTS_OUVERTS, maintenant.toLocalDate(), maintenant.toLocalTime())
            .stream()
            .filter(rdv -> !finDeCreneau(rdv).isAfter(maintenant))
            .toList();
        if (aCloturer.isEmpty()) return;

        aCloturer.forEach(rdv -> rdv.setStatut(StatutRdv.TERMINE.name()));
        rdvRepo.saveAll(aCloturer);
        log.info("{} rendez-vous clôturés automatiquement (créneau écoulé)", aCloturer.size());
    }

    /** Fin du créneau réservé, marge comprise. */
    private LocalDateTime finDeCreneau(RendezVousEntity rdv) {
        return LocalDateTime.of(rdv.getDateRdv(), rdv.getHeureRdv())
            .plusMinutes(rdv.getDuree())
            .plusMinutes(margeClotureMinutes);
    }

    /**
     * Invite les patients de la veille à noter leur consultation.
     *
     * <p>Le lendemain plutôt que juste après : une sollicitation immédiate tombe alors que
     * le patient sort à peine du cabinet. Un rendez-vous déjà noté n'est jamais relancé.
     */
    @Scheduled(cron = "${doctorek.rdv.invitation-avis-cron:0 0 10 * * *}", zone = "${doctorek.timezone:Africa/Casablanca}")
    @Transactional
    public void inviterANoter() {
        LocalDate veille = LocalDate.now(zone).minusDays(1);

        for (RendezVousEntity rdv : rdvRepo.findInvitationsAvisEnAttente(veille, StatutRdv.TERMINE.name())) {
            // La réservation est atomique : un second passage dans la journée n'invite pas deux fois.
            // L'évaluation s'arrête au premier refus, donc rien n'est réservé pour un avis déjà déposé.
            boolean aInviter = !avisRepo.existsByRdvId(rdv.getId())
                && rdvRepo.reserverInvitationAvis(rdv.getId(), Instant.now()) > 0;
            if (aInviter) inviter(rdv);
        }
    }

    private void inviter(RendezVousEntity rdv) {
        String medecinNom = userRepo.findById(rdv.getMedecinId())
            .map(m -> "Dr. " + m.getFirstName() + " " + m.getLastName())
            .orElse("votre médecin");

        // Compte famille : seul le compte capable d'ouvrir le formulaire est sollicité,
        // et le service refusera de toute façon un avis déposé pour le rendez-vous d'autrui.
        notificationRouting.resolveTousComptes(rdv.getPatientId()).forEach(userId ->
            notifications.push(
                userId,
                "AVIS_INVITATION",
                "Comment s'est passée votre consultation ?",
                "Donnez votre avis sur " + medecinNom + ", quelques secondes suffisent."));
    }
}
