package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Patient souhaitant une place plus tôt chez un médecin, sur une plage de dates.
 *
 * <p>Quand un rendez-vous est annulé, les inscriptions actives dont la plage couvre
 * la date libérée sont prévenues. Le créneau revient au premier qui réserve : rien
 * n'est réservé d'avance, l'inscription reste {@code ACTIVE} jusqu'à ce que le
 * patient obtienne une place.
 */
@Entity
@Table(schema = "agenda", name = "liste_attente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListeAttenteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "medecin_id", nullable = false)
    private UUID medecinId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    /** Compte à l'origine de l'inscription : le patient, ou le titulaire pour un proche. */
    @Column(name = "cree_par")
    private UUID creePar;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(nullable = false, length = 20)
    private String statut;

    /** Évite de renotifier le même patient à chaque annulation d'une même journée. */
    @Column(name = "derniere_notification_at")
    private Instant derniereNotificationAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (statut == null) statut = "ACTIVE";
    }
}
