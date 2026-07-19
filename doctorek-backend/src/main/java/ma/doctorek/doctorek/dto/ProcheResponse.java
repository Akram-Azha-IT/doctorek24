package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.GestionEntity;
import ma.doctorek.doctorek.entity.PatientEntity;
import ma.doctorek.doctorek.enums.RoleGestion;

import java.time.LocalDate;
import java.util.UUID;

public record ProcheResponse(
        UUID id,
        String nom,
        String prenom,
        LocalDate dateNaissance,
        String lieuNaissance,
        String email,
        String telephone,
        boolean mineur,
        boolean self,
        RoleGestion role,
        Boolean declarationRepresentantLegal) {

    /** Le titulaire lui-même — pas de relation de gestion. */
    public static ProcheResponse self(PatientEntity patient) {
        return new ProcheResponse(
                patient.getId(), patient.getNom(), patient.getPrenom(),
                patient.getDateNaissance(), patient.getLieuNaissance(),
                patient.getEmail(), patient.getTelephone(),
                patient.isMineur(), true, null, null);
    }

    public static ProcheResponse from(PatientEntity patient, GestionEntity gestion) {
        return new ProcheResponse(
                patient.getId(), patient.getNom(), patient.getPrenom(),
                patient.getDateNaissance(), patient.getLieuNaissance(),
                patient.getEmail(), patient.getTelephone(),
                patient.isMineur(), false,
                gestion.getRole(), gestion.isDeclarationRepresentantLegal());
    }
}
