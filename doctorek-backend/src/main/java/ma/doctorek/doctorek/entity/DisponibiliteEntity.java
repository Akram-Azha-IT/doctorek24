package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(schema = "agenda", name = "disponibilites")
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

    public DisponibiliteEntity() {}

    public UUID getId()                         { return id; }
    public void setId(UUID v)                   { this.id = v; }

    public UUID getMedecinId()                  { return medecinId; }
    public void setMedecinId(UUID v)            { this.medecinId = v; }

    public String getJourSemaine()              { return jourSemaine; }
    public void setJourSemaine(String v)        { this.jourSemaine = v; }

    public LocalTime getHeureDebut()            { return heureDebut; }
    public void setHeureDebut(LocalTime v)      { this.heureDebut = v; }

    public LocalTime getHeureFin()              { return heureFin; }
    public void setHeureFin(LocalTime v)        { this.heureFin = v; }

    public int getDureeConsultation()           { return dureeConsultation; }
    public void setDureeConsultation(int v)     { this.dureeConsultation = v; }

    public String getFrequence()                { return frequence; }
    public void setFrequence(String v)          { this.frequence = v; }

    public int getIntervalSemaines()            { return intervalSemaines; }
    public void setIntervalSemaines(int v)      { this.intervalSemaines = v; }

    public LocalDate getDateDebut()             { return dateDebut; }
    public void setDateDebut(LocalDate v)       { this.dateDebut = v; }

    public String getTypeFinRecurrence()        { return typeFinRecurrence; }
    public void setTypeFinRecurrence(String v)  { this.typeFinRecurrence = v; }

    public LocalDate getDateFin()               { return dateFin; }
    public void setDateFin(LocalDate v)         { this.dateFin = v; }
}
