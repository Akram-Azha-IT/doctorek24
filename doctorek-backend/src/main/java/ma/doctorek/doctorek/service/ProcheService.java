package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.AddProcheRequest;
import ma.doctorek.doctorek.dto.ProcheResponse;
import ma.doctorek.doctorek.dto.UpdateProcheRequest;
import ma.doctorek.doctorek.entity.GestionEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.exception.ProcheNotFoundException;
import ma.doctorek.doctorek.repository.GestionRepository;
import ma.doctorek.doctorek.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Gestion des proches (compte famille) : CRUD depuis le compte titulaire. */
@Service
public class ProcheService {

    private final PatientRepository patientRepository;
    private final GestionRepository gestionRepository;
    private final PatientPivotService patientPivotService;

    public ProcheService(PatientRepository patientRepository,
                         GestionRepository gestionRepository,
                         PatientPivotService patientPivotService) {
        this.patientRepository = patientRepository;
        this.gestionRepository = gestionRepository;
        this.patientPivotService = patientPivotService;
    }

    /** Le titulaire (flag self) suivi de ses proches gérés actifs. */
    @Transactional
    public List<ProcheResponse> listProfils(UUID gestionnaireUserId) {
        List<ProcheResponse> profils = new ArrayList<>();
        profils.add(ProcheResponse.self(patientPivotService.getOrCreateSelf(gestionnaireUserId)));

        for (GestionEntity gestion : gestionRepository.findByGestionnaireCompteIdAndActifTrue(gestionnaireUserId)) {
            patientRepository.findById(gestion.getPatientId())
                .ifPresent(patient -> profils.add(ProcheResponse.from(patient, gestion)));
        }
        return profils;
    }

    @Transactional
    public ProcheResponse addProche(UUID gestionnaireUserId, AddProcheRequest request) {
        // Garantit l'existence du pivot titulaire avant de rattacher un proche
        patientPivotService.getOrCreateSelf(gestionnaireUserId);

        PatientEntity proche = new PatientEntity(
            request.nom().trim(), request.prenom().trim(), request.dateNaissance());
        proche.setLieuNaissance(request.lieuNaissance());
        // Règle Doctolib : un mineur ne peut pas avoir ses propres coordonnées —
        // les notifications passent systématiquement par le gestionnaire.
        if (!proche.isMineur()) {
            proche.setEmail(normalize(request.email()));
            proche.setTelephone(normalize(request.telephone()));
        }
        PatientEntity saved = patientRepository.save(proche);

        GestionEntity gestion = new GestionEntity(
            gestionnaireUserId, saved.getId(), request.role(), request.declarationRepresentantLegal());
        gestionRepository.save(gestion);

        return ProcheResponse.from(saved, gestion);
    }

    @Transactional
    public ProcheResponse updateProche(UUID gestionnaireUserId, UUID procheId, UpdateProcheRequest request) {
        GestionEntity gestion = gestionRepository
            .findByGestionnaireCompteIdAndPatientIdAndActifTrue(gestionnaireUserId, procheId)
            .orElseThrow(() -> new ProcheNotFoundException(procheId));

        PatientEntity proche = patientRepository.findById(procheId)
            .orElseThrow(() -> new ProcheNotFoundException(procheId));

        proche.setNom(request.nom().trim());
        proche.setPrenom(request.prenom().trim());
        proche.setDateNaissance(request.dateNaissance());
        proche.setLieuNaissance(request.lieuNaissance());
        if (proche.isMineur()) {
            proche.setEmail(null);
            proche.setTelephone(null);
        } else {
            proche.setEmail(normalize(request.email()));
            proche.setTelephone(normalize(request.telephone()));
        }
        gestion.setRole(request.role());

        patientRepository.save(proche);
        gestionRepository.save(gestion);
        return ProcheResponse.from(proche, gestion);
    }

    /** Retrait = désactivation de la relation (le dossier du proche est conservé). */
    @Transactional
    public void removeProche(UUID gestionnaireUserId, UUID procheId) {
        GestionEntity gestion = gestionRepository
            .findByGestionnaireCompteIdAndPatientIdAndActifTrue(gestionnaireUserId, procheId)
            .orElseThrow(() -> new ProcheNotFoundException(procheId));
        gestion.setActif(false);
        gestionRepository.save(gestion);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
