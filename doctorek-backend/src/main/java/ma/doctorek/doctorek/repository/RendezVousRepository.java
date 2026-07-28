package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.RendezVousEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.QueryHint;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

public interface RendezVousRepository extends JpaRepository<RendezVousEntity, UUID> {

    long countByDateRdv(LocalDate dateRdv);
    long countByStatut(String statut);

    List<RendezVousEntity> findByMedecinIdAndDateRdv(UUID medecinId, LocalDate dateRdv);

    Page<RendezVousEntity> findByPatientId(UUID patientId, Pageable pageable);

    Page<RendezVousEntity> findByMedecinId(UUID medecinId, Pageable pageable);

    @QueryHints(@QueryHint(name = org.hibernate.jpa.HibernateHints.HINT_FETCH_SIZE, value = "50"))
    @Query("SELECT r FROM RendezVousEntity r WHERE r.dateRdv = :dateRdv AND r.statut <> :statut")
    Stream<RendezVousEntity> streamByDateRdvAndStatutNot(LocalDate dateRdv, String statut);

    boolean existsByMedecinIdAndDateRdvAndHeureRdv(UUID medecinId, LocalDate dateRdv, LocalTime heureRdv);

    boolean existsByMedecinIdAndPatientId(UUID medecinId, UUID patientId);

    /** Fusion compte famille : réaffecte les RDV d'un patient orphelin vers un pivot. */
    @Modifying
    @Query("UPDATE RendezVousEntity r SET r.patientId = :to WHERE r.patientId = :from")
    int reassignPatient(@Param("from") UUID from, @Param("to") UUID to);

    List<RendezVousEntity> findByDateRdvAndStatutNot(LocalDate dateRdv, String statut);

    /**
     * Rendez-vous encore à rappeler sur une plage de dates.
     *
     * <p>La plage couvre deux jours car la fenêtre de rappel franchit minuit pour les
     * consultations de tout début de matinée.
     */
    @Query("""
        SELECT r FROM RendezVousEntity r
        WHERE r.dateRdv BETWEEN :debut AND :fin
          AND r.statut <> :statut
          AND r.rappel30minEnvoyeAt IS NULL
        """)
    List<RendezVousEntity> findRappelsEnAttente(
        @Param("debut") LocalDate debut,
        @Param("fin") LocalDate fin,
        @Param("statut") String statut);

    /**
     * Réserve le rappel d'un rendez-vous.
     *
     * <p>La condition {@code IS NULL} rend l'opération atomique : deux passages
     * concurrents ne peuvent pas la satisfaire tous les deux, donc un seul envoie.
     *
     * @return 1 si l'appelant a obtenu le rappel, 0 s'il était déjà envoyé
     */
    @Modifying
    @Query("""
        UPDATE RendezVousEntity r SET r.rappel30minEnvoyeAt = :maintenant
        WHERE r.id = :id AND r.rappel30minEnvoyeAt IS NULL
        """)
    int reserverRappel30Min(@Param("id") UUID id, @Param("maintenant") Instant maintenant);

    /**
     * Patients ayant consulté ce médecin, avec leur photo de profil.
     *
     * <p>La photo téléversée dans le profil prime, sinon on retombe sur l'avatar du compte
     * (connexion Google). Les jointures sont externes car un proche sans compte rattaché
     * ne possède aucune des deux.
     *
     * <p>Ne pas mettre de commentaire SQL dans la requête : Spring Data analyse la chaîne
     * pour y trouver les paramètres nommés sans interpréter les commentaires, et une simple
     * apostrophe française y ouvrirait un littéral jamais refermé — le repository ne serait
     * alors pas créé et le contexte Spring échouerait au démarrage.
     */
    @Query(value = """
        SELECT r.patient_id AS "patientId",
               p.prenom AS "firstName",
               p.nom    AS "lastName",
               COALESCE(NULLIF(pd.photo_url, ''), u.avatar_url) AS "photoUrl",
               CAST(g.gestionnaire_compte_id AS VARCHAR) AS "gestionnaireId",
               gu.first_name || ' ' || gu.last_name AS "gestionnaireNom",
               MAX(r.date_rdv) AS "dernierRdvDate",
               (ARRAY_AGG(r.statut ORDER BY r.date_rdv DESC, r.heure_rdv DESC))[1] AS "dernierRdvStatut",
               BOOL_OR(r.date_rdv >= CURRENT_DATE) AS "hasFutureRdv"
        FROM agenda.rendez_vous r
        JOIN patient.patient p ON p.id = r.patient_id
        LEFT JOIN patient.patient_details pd ON pd.user_id = p.compte_id
        LEFT JOIN auth.users u ON u.id = p.compte_id
        LEFT JOIN LATERAL (
            SELECT gg.gestionnaire_compte_id
            FROM patient.gestion gg
            WHERE gg.patient_id = p.id AND gg.actif
            ORDER BY gg.created_at
            LIMIT 1
        ) g ON TRUE
        LEFT JOIN auth.users gu ON gu.id = g.gestionnaire_compte_id
        WHERE r.medecin_id = :medecinId
          AND (:search = '' OR LOWER(p.prenom || ' ' || p.nom) LIKE LOWER(CONCAT('%', :search, '%')))
        GROUP BY r.patient_id, p.id, p.prenom, p.nom, pd.photo_url, u.avatar_url,
                 g.gestionnaire_compte_id, gu.first_name, gu.last_name
        HAVING (:filtre = 'TOUS'
             OR (:filtre = 'ACTIFS' AND BOOL_OR(r.date_rdv >= CURRENT_DATE))
             OR (:filtre = 'ANCIENS' AND NOT BOOL_OR(r.date_rdv >= CURRENT_DATE)))
        ORDER BY MAX(MAX(r.date_rdv)) OVER (PARTITION BY COALESCE(g.gestionnaire_compte_id, p.id)) DESC,
                 COALESCE(g.gestionnaire_compte_id, p.id),
                 (g.gestionnaire_compte_id IS NOT NULL),
                 MAX(r.date_rdv) DESC
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
          JOIN patient.patient p ON p.id = r.patient_id
          WHERE r.medecin_id = :medecinId
            AND (:search = '' OR LOWER(p.prenom || ' ' || p.nom) LIKE LOWER(CONCAT('%', :search, '%')))
          GROUP BY r.patient_id, p.prenom, p.nom
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

    /**
     * Membres du foyer de ce patient, limités à ceux que le médecin suit déjà.
     *
     * <p>Le foyer est identifié par le compte gestionnaire, ou par le patient lui-même
     * quand il gère son propre dossier. Le filtre EXISTS garantit que le médecin ne
     * découvre aucune personne hors de sa patientèle.
     *
     * <p>Ne pas mettre de commentaire SQL dans la requête : voir
     * {@link #findPatientsByMedecinId}.
     */
    @Query(value = """
        SELECT CAST(p.id AS VARCHAR) AS "patientId",
               p.prenom AS "firstName",
               p.nom    AS "lastName",
               COALESCE(NULLIF(pd.photo_url, ''), u.avatar_url) AS "photoUrl",
               CAST(g.gestionnaire_compte_id AS VARCHAR) AS "gestionnaireId",
               gu.first_name || ' ' || gu.last_name AS "gestionnaireNom"
        FROM patient.patient p
        LEFT JOIN patient.patient_details pd ON pd.user_id = p.compte_id
        LEFT JOIN auth.users u ON u.id = p.compte_id
        LEFT JOIN LATERAL (
            SELECT gg.gestionnaire_compte_id
            FROM patient.gestion gg
            WHERE gg.patient_id = p.id AND gg.actif
            ORDER BY gg.created_at
            LIMIT 1
        ) g ON TRUE
        LEFT JOIN auth.users gu ON gu.id = g.gestionnaire_compte_id
        WHERE EXISTS (
            SELECT 1 FROM agenda.rendez_vous r
            WHERE r.medecin_id = :medecinId AND r.patient_id = p.id
        )
          AND COALESCE(g.gestionnaire_compte_id, p.id) = COALESCE(
              (SELECT c.gestionnaire_compte_id
               FROM patient.gestion c
               WHERE c.patient_id = :patientId AND c.actif
               ORDER BY c.created_at
               LIMIT 1),
              :patientId)
        ORDER BY (g.gestionnaire_compte_id IS NOT NULL), p.prenom, p.nom
        """, nativeQuery = true)
    List<FamilleMembreProjection> findFoyerByMedecinAndPatient(
        @Param("medecinId") UUID medecinId,
        @Param("patientId") UUID patientId
    );
}
