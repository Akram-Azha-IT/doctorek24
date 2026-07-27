package ma.doctorek.doctorek.repository;

import java.time.LocalDate;

public interface PatientSummaryProjection {
    String getPatientId();
    String getFirstName();
    String getLastName();
    String getPhotoUrl();
    LocalDate getDernierRdvDate();
    String getDernierRdvStatut();
    boolean isHasFutureRdv();
}
