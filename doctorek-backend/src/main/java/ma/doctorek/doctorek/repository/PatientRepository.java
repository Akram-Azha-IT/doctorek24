package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;

public interface PatientRepository extends JpaRepository<PatientEntity, UUID> {

    Optional<PatientEntity> findByCompteId(UUID compteId);

    @Query("""
        SELECT p FROM PatientEntity p
        JOIN GestionEntity g ON g.patientId = p.id
        WHERE g.gestionnaireCompteId = :gestionnaireId AND g.actif = true
        ORDER BY p.createdAt
        """)
    List<PatientEntity> findManagedPatients(@Param("gestionnaireId") UUID gestionnaireId);

    /**
     * Crée paresseusement la ligne pivot d'un titulaire de compte (id = users.id,
     * même convention que le backfill V30). Insert natif : évite que le générateur
     * d'id JPA écrase l'id assigné, et gère les courses via ON CONFLICT.
     */
    @Modifying
    @Query(value = """
        INSERT INTO patient.patient (id, nom, prenom, date_naissance, email, telephone, compte_id)
        VALUES (:userId, :nom, :prenom, :dateNaissance, :email, :telephone, :userId)
        ON CONFLICT (id) DO NOTHING
        """, nativeQuery = true)
    void insertSelfPivot(@Param("userId") UUID userId,
                         @Param("nom") String nom,
                         @Param("prenom") String prenom,
                         @Param("dateNaissance") java.time.LocalDate dateNaissance,
                         @Param("email") String email,
                         @Param("telephone") String telephone);

    /**
     * Patients de ce médecin portant les mêmes nom, prénom et date de naissance.
     *
     * <p>Sert à proposer un dossier existant plutôt qu'en créer un second. La
     * comparaison reste stricte sur la date de naissance : deux homonymes réels
     * existent, et fusionner leurs dossiers médicaux serait pire qu'un doublon.
     */
    @Query("""
        SELECT p FROM PatientEntity p
        WHERE LOWER(TRIM(p.nom)) = LOWER(TRIM(:nom))
          AND LOWER(TRIM(p.prenom)) = LOWER(TRIM(:prenom))
          AND p.dateNaissance = :dateNaissance
          AND EXISTS (SELECT 1 FROM RendezVousEntity r
                      WHERE r.patientId = p.id AND r.medecinId = :medecinId)
        """)
    List<PatientEntity> findHomonymesChezMedecin(
        @Param("medecinId") UUID medecinId,
        @Param("nom") String nom,
        @Param("prenom") String prenom,
        @Param("dateNaissance") LocalDate dateNaissance);
}
