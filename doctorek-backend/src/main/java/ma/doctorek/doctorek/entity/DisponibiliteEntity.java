package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(schema = "agenda", name = "disponibilites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisponibiliteEntity {

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

    @Column(name = "frequence", nullable = false, length = 20)
    private String frequence;

    @Column(name = "interval_semaines", nullable = false)
    private int intervalSemaines;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "type_fin", nullable = false, length = 10)
    private String typeFinRecurrence;

    @Column(name = "date_fin")
    private LocalDate dateFin;
}
