package ma.doctorek.doctorek.agenda.infrastructure;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.QueryHint;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

interface JpaRendezVousRepository extends JpaRepository<RendezVousEntity, UUID> {

    List<RendezVousEntity> findByMedecinIdAndDateRdv(UUID medecinId, LocalDate dateRdv);

    Page<RendezVousEntity> findByPatientId(UUID patientId, Pageable pageable);

    Page<RendezVousEntity> findByMedecinId(UUID medecinId, Pageable pageable);

    @QueryHints(@QueryHint(name = org.hibernate.jpa.HibernateHints.HINT_FETCH_SIZE, value = "50"))
    @Query("SELECT r FROM RendezVousEntity r WHERE r.dateRdv = :dateRdv AND r.statut <> :statut")
    Stream<RendezVousEntity> streamByDateRdvAndStatutNot(LocalDate dateRdv, String statut);

    boolean existsByMedecinIdAndDateRdvAndHeureRdv(UUID medecinId, LocalDate dateRdv, LocalTime heureRdv);

    @Query(value = """
        SELECT r.patient_id AS "patientId",
               u.first_name AS "firstName",
               u.last_name  AS "lastName",
               MAX(r.date_rdv) AS "dernierRdvDate",
               (ARRAY_AGG(r.statut ORDER BY r.date_rdv DESC, r.heure_rdv DESC))[1] AS "dernierRdvStatut",
               BOOL_OR(r.date_rdv >= CURRENT_DATE) AS "hasFutureRdv"
        FROM agenda.rendez_vous r
        JOIN auth.users u ON u.id = r.patient_id
        WHERE r.medecin_id = :medecinId
          AND (:search = '' OR LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER(CONCAT('%', :search, '%')))
        GROUP BY r.patient_id, u.first_name, u.last_name
        HAVING (:filtre = 'TOUS'
             OR (:filtre = 'ACTIFS' AND BOOL_OR(r.date_rdv >= CURRENT_DATE))
             OR (:filtre = 'ANCIENS' AND NOT BOOL_OR(r.date_rdv >= CURRENT_DATE)))
        ORDER BY MAX(r.date_rdv) DESC
        LIMIT :size OFFSET :offset
        """, nativeQuery = true)
    List<PatientSummaryProjection> findPatientsByMedecinId(
        @Param("medecinId") UUID medecinId,
        @Param("search") String search,
        @Param("filtre") String filtre,
        @Param("size") int size,
        @Param("offset") int offset
    );

    @Query(value = """
        SELECT COUNT(*) FROM (
          SELECT r.patient_id
          FROM agenda.rendez_vous r
          JOIN auth.users u ON u.id = r.patient_id
          WHERE r.medecin_id = :medecinId
            AND (:search = '' OR LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER(CONCAT('%', :search, '%')))
          GROUP BY r.patient_id, u.first_name, u.last_name
          HAVING (:filtre = 'TOUS'
               OR (:filtre = 'ACTIFS' AND BOOL_OR(r.date_rdv >= CURRENT_DATE))
               OR (:filtre = 'ANCIENS' AND NOT BOOL_OR(r.date_rdv >= CURRENT_DATE)))
        ) sub
        """, nativeQuery = true)
    long countPatientsByMedecinId(
        @Param("medecinId") UUID medecinId,
        @Param("search") String search,
        @Param("filtre") String filtre
    );
}