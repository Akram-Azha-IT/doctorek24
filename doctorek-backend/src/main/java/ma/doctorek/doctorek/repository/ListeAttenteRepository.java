package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.ListeAttenteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ListeAttenteRepository extends JpaRepository<ListeAttenteEntity, UUID> {

    Optional<ListeAttenteEntity> findByMedecinIdAndPatientIdAndStatut(
        UUID medecinId, UUID patientId, String statut);

    List<ListeAttenteEntity> findByPatientIdAndStatutOrderByCreatedAtDesc(UUID patientId, String statut);

    /**
     * Inscriptions à prévenir quand une place se libère à cette date.
     *
     * <p>Le patient qui vient d'annuler est exclu : lui proposer le créneau qu'il
     * vient de rendre n'aurait pas de sens.
     */
    @Query("""
        SELECT l FROM ListeAttenteEntity l
        WHERE l.medecinId = :medecinId
          AND l.statut = 'ACTIVE'
          AND :date BETWEEN l.dateDebut AND l.dateFin
          AND l.patientId <> :patientExclu
        ORDER BY l.createdAt
        """)
    List<ListeAttenteEntity> findCandidats(
        @Param("medecinId") UUID medecinId,
        @Param("date") LocalDate date,
        @Param("patientExclu") UUID patientExclu);
}
