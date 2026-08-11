package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.AvisEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AvisRepository extends JpaRepository<AvisEntity, UUID> {

    /** Un rendez-vous ne porte qu'un avis — garde applicative, doublée par un index unique. */
    boolean existsByRdvId(UUID rdvId);

    Optional<AvisEntity> findByRdvId(UUID rdvId);

    /** Rendez-vous de ce patient déjà notés, pour retirer le bouton « Donner mon avis ». */
    @Query("SELECT a.rdvId FROM AvisEntity a WHERE a.patientId IN :patientIds")
    List<UUID> findRdvIdsNotes(@Param("patientIds") Collection<UUID> patientIds);

    /**
     * Avis visibles d'un médecin, du plus récent au plus ancien.
     *
     * <p>Un avis signalé reste public : le signalement le pousse en file de modération,
     * il ne le retire pas. Seul {@code MASQUE} le sort de la vue.
     */
    @Query(value = """
        SELECT a.id AS id, a.note AS note, a.commentaire AS commentaire, a.anonyme AS anonyme,
               a.statut AS statut, a.createdAt AS createdAt, p.prenom AS prenom, p.nom AS nom
        FROM AvisEntity a JOIN PatientEntity p ON p.id = a.patientId
        WHERE a.medecinId = :medecinId AND a.statut <> 'MASQUE'
        ORDER BY a.createdAt DESC
        """,
        countQuery = """
        SELECT COUNT(a) FROM AvisEntity a
        WHERE a.medecinId = :medecinId AND a.statut <> 'MASQUE'
        """)
    Page<AvisProjection> findPubliesByMedecinId(@Param("medecinId") UUID medecinId, Pageable pageable);

    /** Moyenne et volume d'un médecin — sert le bandeau de note du profil public. */
    @Query("""
        SELECT AVG(CAST(a.note AS double)) FROM AvisEntity a
        WHERE a.medecinId = :medecinId AND a.statut <> 'MASQUE'
        """)
    Double moyenneParMedecin(@Param("medecinId") UUID medecinId);

    long countByMedecinIdAndStatutNot(UUID medecinId, String statut);

    /**
     * Notes de plusieurs médecins en une requête — les cartes de résultats de recherche.
     *
     * <p>Les médecins sans avis visible n'ont pas de ligne : l'absence est la réponse,
     * une moyenne de 0 serait lue comme une mauvaise note.
     */
    @Query("""
        SELECT a.medecinId AS medecinId, AVG(CAST(a.note AS double)) AS moyenne, COUNT(a) AS total
        FROM AvisEntity a
        WHERE a.medecinId IN :medecinIds AND a.statut <> 'MASQUE'
        GROUP BY a.medecinId
        """)
    List<NoteMedecinProjection> notesParMedecins(@Param("medecinIds") Collection<UUID> medecinIds);

    /** Répartition des notes de 1 à 5 — l'histogramme du bandeau d'avis. */
    @Query("""
        SELECT a.note AS note, COUNT(a) AS total
        FROM AvisEntity a
        WHERE a.medecinId = :medecinId AND a.statut <> 'MASQUE'
        GROUP BY a.note
        """)
    List<RepartitionNotesProjection> repartitionParMedecin(@Param("medecinId") UUID medecinId);

    /** File de modération : les signalés d'abord, puis les masqués. */
    @Query(value = """
        SELECT a.id AS id, a.note AS note, a.commentaire AS commentaire, a.anonyme AS anonyme,
               a.statut AS statut, a.createdAt AS createdAt, p.prenom AS prenom, p.nom AS nom
        FROM AvisEntity a JOIN PatientEntity p ON p.id = a.patientId
        WHERE a.statut IN :statuts
        ORDER BY a.updatedAt DESC
        """,
        countQuery = "SELECT COUNT(a) FROM AvisEntity a WHERE a.statut IN :statuts")
    Page<AvisProjection> findParStatuts(@Param("statuts") Collection<String> statuts, Pageable pageable);
}
