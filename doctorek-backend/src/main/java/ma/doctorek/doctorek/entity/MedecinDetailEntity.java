package ma.doctorek.doctorek.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(schema = "annuaire", name = "medecin_details")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    public MedecinDetailEntity(User user, String inpe, String specialite, String ville, String adresse) {
        this.user       = user;
        this.inpe       = inpe;
        this.specialite = specialite;
        this.ville      = ville;
        this.adresse    = adresse;
    }

    public void updateProfile(String specialite, String ville, String adresse,
                              Double latitude, Double longitude) {
        this.specialite = specialite;
        this.ville      = ville;
        this.adresse    = adresse;
        if (latitude != null)  this.latitude  = latitude;
        if (longitude != null) this.longitude = longitude;
    }
}
