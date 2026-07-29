package ma.doctorek.doctorek.repository;

import java.time.LocalDate;

public interface PatientSummaryProjection {
    String getPatientId();
    String getFirstName();
    String getLastName();
    String getPhotoUrl();
    /** Compte gestionnaire quand ce patient est un proche ; null s'il gère son propre dossier. */
    String getGestionnaireId();
    String getGestionnaireNom();
    LocalDate getDernierRdvDate();
    String getDernierRdvStatut();
    boolean isHasFutureRdv();
}
