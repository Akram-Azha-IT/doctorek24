package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(schema = "patient", name = "patient_details")
public class PatientDetailEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "genre", length = 20)
    private String genre;

    @Column(name = "nationalite", length = 100)
    private String nationalite;

    @Column(name = "num_identite", columnDefinition = "TEXT")
    private String numIdentite;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "telephone", length = 30)
    private String telephone;

    @Column(name = "adresse_rue", columnDefinition = "TEXT")
    private String adresseRue;

    @Column(name = "adresse_ville", length = 100)
    private String adresseVille;

    @Column(name = "adresse_pays", length = 100)
    private String adressePays;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PatientDetailEntity() {}

    public PatientDetailEntity(User user) {
        this.user = user;
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

    public UUID getUserId()              { return userId; }
    public User getUser()                { return user; }

    public LocalDate getDateNaissance()  { return dateNaissance; }
    public void setDateNaissance(LocalDate v) { this.dateNaissance = v; }

    public String getGenre()             { return genre; }
    public void setGenre(String v)       { this.genre = v; }

    public String getNationalite()       { return nationalite; }
    public void setNationalite(String v) { this.nationalite = v; }

    public String getNumIdentite()       { return numIdentite; }
    public void setNumIdentite(String v) { this.numIdentite = v; }

    public String getPhotoUrl()          { return photoUrl; }
    public void setPhotoUrl(String v)    { this.photoUrl = v; }

    public String getTelephone()         { return telephone; }
    public void setTelephone(String v)   { this.telephone = v; }

    public String getAdresseRue()        { return adresseRue; }
    public void setAdresseRue(String v)  { this.adresseRue = v; }

    public String getAdresseVille()      { return adresseVille; }
    public void setAdresseVille(String v) { this.adresseVille = v; }

    public String getAdressePays()       { return adressePays; }
    public void setAdressePays(String v) { this.adressePays = v; }

    public Instant getCreatedAt()        { return createdAt; }
    public Instant getUpdatedAt()        { return updatedAt; }
}
