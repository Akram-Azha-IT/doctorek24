package ma.doctorek.doctorek.dossier.infrastructure;

import ma.doctorek.doctorek.dossier.domain.*;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaDossierRepository implements DossierRepository {

    private final SpringDataInfosMedicalesRepository infosRepo;
    private final SpringDataOrdonnanceRepository ordonnanceRepo;
    private final SpringDataDocumentRepository documentRepo;

    public JpaDossierRepository(
        SpringDataInfosMedicalesRepository infosRepo,
        SpringDataOrdonnanceRepository ordonnanceRepo,
        SpringDataDocumentRepository documentRepo
    ) {
        this.infosRepo = infosRepo;
        this.ordonnanceRepo = ordonnanceRepo;
        this.documentRepo = documentRepo;
    }

    @Override
    public Optional<InfosMedicales> findInfosByPatientId(UUID patientId) {
        return infosRepo.findById(patientId).map(InfosMedicalesEntity::toDomain);
    }

    @Override
    public InfosMedicales saveInfos(InfosMedicales infos) {
        return infosRepo.save(InfosMedicalesEntity.fromDomain(infos)).toDomain();
    }

    @Override
    public List<Ordonnance> findOrdonnancesByPatientId(UUID patientId) {
        return ordonnanceRepo.findAllByPatientIdOrderByDateEmissionDesc(patientId)
            .stream().map(OrdonnanceEntity::toDomain).toList();
    }

    @Override
    public Ordonnance saveOrdonnance(Ordonnance ordonnance) {
        return ordonnanceRepo.save(OrdonnanceEntity.fromDomain(ordonnance)).toDomain();
    }

    @Override
    public void deleteOrdonnance(UUID id) {
        ordonnanceRepo.deleteById(id);
    }

    @Override
    public List<DocumentMedical> findDocumentsByPatientId(UUID patientId) {
        return documentRepo.findAllByPatientIdOrderByCreatedAtDesc(patientId)
            .stream().map(DocumentMedicalEntity::toDomain).toList();
    }

    @Override
    public DocumentMedical saveDocument(DocumentMedical document) {
        return documentRepo.save(DocumentMedicalEntity.fromDomain(document)).toDomain();
    }

    @Override
    public Optional<DocumentMedical> findDocumentById(UUID id) {
        return documentRepo.findById(id).map(DocumentMedicalEntity::toDomain);
    }

    @Override
    public void deleteDocument(UUID id) {
        documentRepo.deleteById(id);
    }
}
