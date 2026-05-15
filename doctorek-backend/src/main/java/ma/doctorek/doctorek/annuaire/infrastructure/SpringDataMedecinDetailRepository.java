package ma.doctorek.doctorek.annuaire.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataMedecinDetailRepository extends JpaRepository<MedecinDetailEntity, UUID> {

    boolean existsByInpe(String inpe);

    @Query("SELECT md FROM MedecinDetailEntity md JOIN FETCH md.user u " +
           "WHERE u.active = true AND md.latitude IS NOT NULL AND md.longitude IS NOT NULL " +
           "AND (:specialite IS NULL OR lower(md.specialite) LIKE %:specialite%)")
    List<MedecinDetailEntity> findActiveMedecinsWithCoords(@Param("specialite") String specialite);

    @Query("SELECT md FROM MedecinDetailEntity md JOIN FETCH md.user u " +
           "WHERE md.userId = :id AND u.active = true")
    Optional<MedecinDetailEntity> findActiveMedecinById(@Param("id") UUID id);

    @Query(value = """
        SELECT md.* FROM annuaire.medecin_details md
        JOIN auth.users u ON md.user_id = u.id
        WHERE u.is_active = true
        AND (:specialite IS NULL OR :specialite = ''
             OR auth.similarity(md.specialite, :specialite) > 0.15
             OR lower(md.specialite) LIKE lower(('%' || :specialite || '%')))
        AND (:ville IS NULL OR :ville = ''
             OR auth.similarity(md.ville, :ville) > 0.15
             OR lower(md.ville) LIKE lower(('%' || :ville || '%')))
        ORDER BY
            CASE WHEN :specialite IS NOT NULL AND :specialite != ''
                 THEN auth.similarity(md.specialite, :specialite) ELSE 1 END DESC,
            CASE WHEN :ville IS NOT NULL AND :ville != ''
                 THEN auth.similarity(md.ville, :ville) ELSE 1 END DESC
        """, nativeQuery = true)
    List<MedecinDetailEntity> searchActiveMedecins(@Param("specialite") String specialite,
                                                   @Param("ville") String ville);
}
