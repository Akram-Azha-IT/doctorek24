package ma.doctorek.doctorek.repository;

import java.time.LocalDate;

public interface PatientSummaryProjection {
    String getPatientId();
    String getFirstName();
    String getLastName();
    LocalDate getDernierRdvDate();
    String getDernierRdvStatut();
    boolean isHasFutureRdv();
}
