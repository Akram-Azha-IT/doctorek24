package ma.doctorek.doctorek.agenda.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.doctorek.doctorek.agenda.application.dto.PrendreRdvRequest;
import ma.doctorek.doctorek.agenda.domain.CreneauIndisponibleException;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteRepository;
import ma.doctorek.doctorek.agenda.domain.MedecinSansAgendaException;
import ma.doctorek.doctorek.agenda.domain.RendezVous;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import ma.doctorek.doctorek.notification.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PrendreRdvUseCase {

    private static final Logger log = LoggerFactory.getLogger(PrendreRdvUseCase.class);

    private final DisponibiliteRepository dispoRepo;
    private final RendezVousRepository    rdvRepo;
    private final UserRepository          userRepo;
    private final EmailService            emailService;
    private final ObjectMapper            objectMapper;

    public PrendreRdvUseCase(DisponibiliteRepository dispoRepo,
                              RendezVousRepository rdvRepo,
                              UserRepository userRepo,
                              EmailService emailService,
                              ObjectMapper objectMapper) {
        this.dispoRepo    = dispoRepo;
        this.rdvRepo      = rdvRepo;
        this.userRepo     = userRepo;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    public RendezVous execute(PrendreRdvRequest request) {
        Disponibilite dispo = dispoRepo
            .findByMedecinIdAndJour(request.medecinId(), request.dateRdv().getDayOfWeek())
            .orElseThrow(() -> new MedecinSansAgendaException(request.medecinId()));

        if (rdvRepo.existsByMedecinIdAndDateAndHeure(
                request.medecinId(), request.dateRdv(), request.heureRdv())) {
            throw new CreneauIndisponibleException(
                "Créneau indisponible : " + request.dateRdv() + " à " + request.heureRdv());
        }

        String questionnaireJson = null;
        if (request.questionnaire() != null) {
            try {
                questionnaireJson = objectMapper.writeValueAsString(request.questionnaire());
            } catch (JsonProcessingException e) {
                log.warn("Impossible de sérialiser le questionnaire", e);
            }
        }

        RendezVous rdv = new RendezVous(
            null,
            request.medecinId(),
            request.patientId(),
            request.dateRdv(),
            request.heureRdv(),
            dispo.dureeConsultation(),
            StatutRdv.EN_ATTENTE,
            request.motif(),
            questionnaireJson,
            LocalDateTime.now()
        );

        RendezVous saved = rdvRepo.save(rdv);

        userRepo.findById(request.patientId())
            .ifPresentOrElse(
                patient -> emailService.sendConfirmationRdv(patient.getEmail(), saved),
                () -> log.warn("Patient introuvable pour rdv {} — confirmation email non envoyé", saved.id())
            );

        return saved;
    }
}
