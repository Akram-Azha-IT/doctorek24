package ma.doctorek.doctorek.repository;

/** Membre du foyer d'un patient, restreint à ceux que le médecin suit déjà. */
public interface FamilleMembreProjection {
    String getPatientId();
    String getFirstName();
    String getLastName();
    String getPhotoUrl();
    String getGestionnaireId();
    String getGestionnaireNom();
}
