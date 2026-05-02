package ma.doctorek.doctorek.carte.infrastructure;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cartes_virtuelles", schema = "carte")
public class CarteVirtuelleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false, unique = true)
    private UUID patientId;

    @Column(name = "card_ref", nullable = false, unique = true)
    private String cardRef;

    @Column(name = "statut", nullable = false)
    private String statut = "VIRTUEL";

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "genre")
    private String genre;

    @Column(name = "nationalite")
    private String nationalite;

    @Column(name = "num_identite", columnDefinition = "TEXT")
    private String numIdentite;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "telephone")
    private String telephone;

    @Column(name = "adresse_rue", columnDefinition = "TEXT")
    private String adresseRue;

    @Column(name = "adresse_ville")
    private String adresseVille;

    @Column(name = "adresse_pays")
    private String adressePays;

    @Column(name = "groupe_sanguin")
    private String groupeSanguin;

    @Column(name = "taille_cm")
    private Integer tailleCm;

    @Column(name = "poids_kg")
    private BigDecimal poidsKg;

    @Column(name = "donneur_organes")
    private Boolean donneurOrganes = false;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "maladies_chroniques", columnDefinition = "TEXT")
    private String maladiesChroniques;

    @Column(name = "medicaments_actuels", columnDefinition = "TEXT")
    private String medicamentsActuels;

    @Column(name = "antecedents_chirurgicaux", columnDefinition = "TEXT")
    private String antecedentsChirurgicaux;

    @Column(name = "vaccinations", columnDefinition = "TEXT")
    private String vaccinations;

    @Column(name = "antecedents_familiaux", columnDefinition = "TEXT")
    private String antecedentsFamiliaux;

    @Column(name = "contacts_urgence", columnDefinition = "TEXT")
    private String contactsUrgence;

    @Column(name = "medecin_traitant", columnDefinition = "TEXT")
    private String medecinTraitant;

    @Column(name = "assurance_nom")
    private String assuranceNom;

    @Column(name = "assurance_numero", columnDefinition = "TEXT")
    private String assuranceNumero;

    @Column(name = "assurance_details", columnDefinition = "TEXT")
    private String assuranceDetails;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPatientId() { return patientId; }
    public void setPatientId(UUID patientId) { this.patientId = patientId; }
    public String getCardRef() { return cardRef; }
    public void setCardRef(String cardRef) { this.cardRef = cardRef; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public LocalDate getDateNaissance() { return dateNaissance; }
    public void setDateNaissance(LocalDate dateNaissance) { this.dateNaissance = dateNaissance; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public String getNationalite() { return nationalite; }
    public void setNationalite(String nationalite) { this.nationalite = nationalite; }
    public String getNumIdentite() { return numIdentite; }
    public void setNumIdentite(String numIdentite) { this.numIdentite = numIdentite; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public String getAdresseRue() { return adresseRue; }
    public void setAdresseRue(String adresseRue) { this.adresseRue = adresseRue; }
    public String getAdresseVille() { return adresseVille; }
    public void setAdresseVille(String adresseVille) { this.adresseVille = adresseVille; }
    public String getAdressePays() { return adressePays; }
    public void setAdressePays(String adressePays) { this.adressePays = adressePays; }
    public String getGroupeSanguin() { return groupeSanguin; }
    public void setGroupeSanguin(String groupeSanguin) { this.groupeSanguin = groupeSanguin; }
    public Integer getTailleCm() { return tailleCm; }
    public void setTailleCm(Integer tailleCm) { this.tailleCm = tailleCm; }
    public BigDecimal getPoidsKg() { return poidsKg; }
    public void setPoidsKg(BigDecimal poidsKg) { this.poidsKg = poidsKg; }
    public Boolean getDonneurOrganes() { return donneurOrganes; }
    public void setDonneurOrganes(Boolean donneurOrganes) { this.donneurOrganes = donneurOrganes; }
    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
    public String getMaladiesChroniques() { return maladiesChroniques; }
    public void setMaladiesChroniques(String maladiesChroniques) { this.maladiesChroniques = maladiesChroniques; }
    public String getMedicamentsActuels() { return medicamentsActuels; }
    public void setMedicamentsActuels(String medicamentsActuels) { this.medicamentsActuels = medicamentsActuels; }
    public String getAntecedentsChirurgicaux() { return antecedentsChirurgicaux; }
    public void setAntecedentsChirurgicaux(String antecedentsChirurgicaux) { this.antecedentsChirurgicaux = antecedentsChirurgicaux; }
    public String getVaccinations() { return vaccinations; }
    public void setVaccinations(String vaccinations) { this.vaccinations = vaccinations; }
    public String getAntecedentsFamiliaux() { return antecedentsFamiliaux; }
    public void setAntecedentsFamiliaux(String antecedentsFamiliaux) { this.antecedentsFamiliaux = antecedentsFamiliaux; }
    public String getContactsUrgence() { return contactsUrgence; }
    public void setContactsUrgence(String contactsUrgence) { this.contactsUrgence = contactsUrgence; }
    public String getMedecinTraitant() { return medecinTraitant; }
    public void setMedecinTraitant(String medecinTraitant) { this.medecinTraitant = medecinTraitant; }
    public String getAssuranceNom() { return assuranceNom; }
    public void setAssuranceNom(String assuranceNom) { this.assuranceNom = assuranceNom; }
    public String getAssuranceNumero() { return assuranceNumero; }
    public void setAssuranceNumero(String assuranceNumero) { this.assuranceNumero = assuranceNumero; }
    public String getAssuranceDetails() { return assuranceDetails; }
    public void setAssuranceDetails(String assuranceDetails) { this.assuranceDetails = assuranceDetails; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
