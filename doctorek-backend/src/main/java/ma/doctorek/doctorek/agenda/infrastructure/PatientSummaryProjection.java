package ma.doctorek.doctorek.agenda.infrastructure;

import java.time.LocalDate;

interface PatientSummaryProjection {
    String getPatientId();
    String getFirstName();
    String getLastName();
    LocalDate getDernierRdvDate();
    String getDernierRdvStatut();
    boolean isHasFutureRdv();
}
