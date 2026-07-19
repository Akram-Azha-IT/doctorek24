package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

/**
 * Entité pivot "patient" : toute personne recevant des soins.
 * Le compte (auth.users) est une capacité optionnelle — compteId est NULL
 * pour un proche géré via patient.gestion.
 */
@Entity
@Table(schema = "patient", name = "patient")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PatientEntity {

    private static final int AGE_MAJORITE = 18;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nom", nullable = false, columnDefinition = "TEXT")
    private String nom;

    @Column(name = "prenom", nullable = false, columnDefinition = "TEXT")
    private String prenom;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "lieu_naissance", columnDefinition = "TEXT")
    private String lieuNaissance;

    @Column(name = "email", columnDefinition = "TEXT")
    private String email;

    @Column(name = "telephone", columnDefinition = "TEXT")
    private String telephone;

    @Column(name = "compte_id", unique = true)
    private UUID compteId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public PatientEntity(String nom, String prenom, LocalDate dateNaissance) {
        this.nom = nom;
        this.prenom = prenom;
        this.dateNaissance = dateNaissance;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }

    /** Date de naissance NULL = titulaire de compte sans date renseignée → traité comme majeur. */
    public boolean isMineur() {
        return dateNaissance != null
            && Period.between(dateNaissance, LocalDate.now()).getYears() < AGE_MAJORITE;
    }

    public boolean hasCompte() {
        return compteId != null;
    }
}
