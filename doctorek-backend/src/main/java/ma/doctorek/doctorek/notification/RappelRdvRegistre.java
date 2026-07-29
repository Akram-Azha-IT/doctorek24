package ma.doctorek.doctorek.notification;

import ma.doctorek.doctorek.repository.RendezVousRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Garantit qu'un rendez-vous ne reçoit son rappel qu'une fois.
 *
 * <p>Composant distinct et non classe interne : l'auto-invocation contourne le proxy
 * Spring, la transaction dédiée ne s'appliquerait pas depuis l'appelant.
 */
@Component
public class RappelRdvRegistre {

    private final RendezVousRepository rdvRepo;

    public RappelRdvRegistre(RendezVousRepository rdvRepo) {
        this.rdvRepo = rdvRepo;
    }

    /**
     * Tente de réserver l'envoi du rappel.
     *
     * <p>La transaction dédiée valide la marque avant l'envoi : si l'e-mail échoue
     * ensuite, le rappel est perdu plutôt que renvoyé en boucle à chaque minute.
     *
     * @return {@code true} si l'appelant doit envoyer le rappel
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean reserver(UUID rdvId) {
        return rdvRepo.reserverRappel30Min(rdvId, Instant.now()) == 1;
    }
}
