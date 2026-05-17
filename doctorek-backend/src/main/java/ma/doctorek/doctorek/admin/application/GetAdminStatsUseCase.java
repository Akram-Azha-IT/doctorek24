package ma.doctorek.doctorek.admin.application;

import ma.doctorek.doctorek.admin.application.dto.AdminStatsResponse;
import ma.doctorek.doctorek.agenda.domain.RendezVousRepository;
import ma.doctorek.doctorek.agenda.domain.StatutRdv;
import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import ma.doctorek.doctorek.carte.infrastructure.SpringDataCarteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class GetAdminStatsUseCase {

    private final UserRepository userRepository;
    private final RendezVousRepository rdvRepository;
    private final SpringDataCarteRepository carteRepository;

    public GetAdminStatsUseCase(UserRepository userRepository,
                                RendezVousRepository rdvRepository,
                                SpringDataCarteRepository carteRepository) {
        this.userRepository  = userRepository;
        this.rdvRepository   = rdvRepository;
        this.carteRepository = carteRepository;
    }

    public AdminStatsResponse execute() {
        return new AdminStatsResponse(
                userRepository.countByRole(Role.PATIENT),
                userRepository.countByRole(Role.MEDECIN),
                rdvRepository.countAll(),
                rdvRepository.countByDateRdv(LocalDate.now()),
                rdvRepository.countByStatut(StatutRdv.EN_ATTENTE),
                carteRepository.count()
        );
    }
}
