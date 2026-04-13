package ma.doctorek.doctorek.agenda.infrastructure;

import jakarta.persistence.*;
import ma.doctorek.doctorek.agenda.domain.Disponibilite;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(schema = "agenda", name = "disponibilites")
class DisponibiliteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "medecin_id", nullable = false)
    private UUID medecinId;

    @Column(name = "jour_semaine", nullable = false, length = 10)
    private String jourSemaine;

    @Column(name = "heure_debut", nullable = false)
    private LocalTime heureDebut;

    @Column(name = "heure_fin", nullable = false)
    private LocalTime heureFin;

    @Column(name = "duree_consultation", nullable = false)
    private int dureeConsultation;

    protected DisponibiliteEntity() {}

    Disponibilite toDomain() {
        return new Disponibilite(
            id,
            medecinId,
            DayOfWeek.valueOf(jourSemaine),
            heureDebut,
            heureFin,
            dureeConsultation
        );
    }

    static DisponibiliteEntity fromDomain(Disponibilite d) {
        DisponibiliteEntity e = new DisponibiliteEntity();
        e.id                 = d.id();
        e.medecinId          = d.medecinId();
        e.jourSemaine        = d.jourSemaine().name();
        e.heureDebut         = d.heureDebut();
        e.heureFin           = d.heureFin();
        e.dureeConsultation  = d.dureeConsultation();
        return e;
    }
}
