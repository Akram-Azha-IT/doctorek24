package ma.doctorek.doctorek.annuaire.infrastructure;

import jakarta.persistence.*;
import ma.doctorek.doctorek.auth.domain.User;

import java.util.UUID;

@Entity
@Table(schema = "annuaire", name = "medecin_details")
public class MedecinDetailEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.EAGER)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(unique = true, nullable = false, length = 10)
    private String inpe;

    @Column(length = 100)
    private String specialite;

    @Column(length = 100)
    private String ville;

    @Column(columnDefinition = "TEXT")
    private String adresse;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    protected MedecinDetailEntity() {}

    public MedecinDetailEntity(User user, String inpe, String specialite, String ville, String adresse) {
        this.user      = user;
        this.userId    = user.getId();
        this.inpe      = inpe;
        this.specialite = specialite;
        this.ville     = ville;
        this.adresse   = adresse;
    }

    public void updateProfile(String specialite, String ville, String adresse,
                              Double latitude, Double longitude) {
        this.specialite = specialite;
        this.ville      = ville;
        this.adresse    = adresse;
        if (latitude != null)  this.latitude  = latitude;
        if (longitude != null) this.longitude = longitude;
    }

    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public UUID getUserId()      { return userId; }
    public User getUser()        { return user; }
    public String getInpe()      { return inpe; }
    public String getSpecialite(){ return specialite; }
    public String getVille()     { return ville; }
    public String getAdresse()   { return adresse; }
    public Double getLatitude()  { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getPhotoUrl()  { return photoUrl; }
}
