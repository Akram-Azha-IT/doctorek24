package ma.doctorek.doctorek.dossier.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DossierRepository {
    Optional<InfosMedicales> findInfosByPatientId(UUID patientId);
    InfosMedicales saveInfos(InfosMedicales infos);

    List<Ordonnance> findOrdonnancesByPatientId(UUID patientId);
    Ordonnance saveOrdonnance(Ordonnance ordonnance);
    void deleteOrdonnance(UUID id);

    List<DocumentMedical> findDocumentsByPatientId(UUID patientId);
    DocumentMedical saveDocument(DocumentMedical document);
    Optional<DocumentMedical> findDocumentById(UUID id);
    void deleteDocument(UUID id);
}
