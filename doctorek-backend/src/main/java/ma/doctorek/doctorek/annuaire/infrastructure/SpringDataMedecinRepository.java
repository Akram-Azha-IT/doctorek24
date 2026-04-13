package ma.doctorek.doctorek.annuaire.infrastructure;

import ma.doctorek.doctorek.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataMedecinRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.role = 'MEDECIN' AND u.active = true")
    Optional<User> findActiveMedecinById(@Param("id") UUID id);

    @Query(value = """
        SELECT u.* FROM auth.users u
        WHERE u.role = 'MEDECIN' AND u.is_active = true
        AND (:specialite IS NULL OR :specialite = ''
             OR auth.similarity(u.specialite, :specialite) > 0.15
             OR lower(u.specialite) LIKE lower(('%' || :specialite || '%')))
        AND (:ville IS NULL OR :ville = ''
             OR auth.similarity(u.ville, :ville) > 0.15
             OR lower(u.ville) LIKE lower(('%' || :ville || '%')))
        ORDER BY
            CASE WHEN :specialite IS NOT NULL AND :specialite != ''
                 THEN auth.similarity(u.specialite, :specialite) ELSE 1 END DESC,
            CASE WHEN :ville IS NOT NULL AND :ville != ''
                 THEN auth.similarity(u.ville, :ville) ELSE 1 END DESC
        """, nativeQuery = true)
    List<User> searchActiveMedecins(@Param("specialite") String specialite,
                                    @Param("ville") String ville);
}
