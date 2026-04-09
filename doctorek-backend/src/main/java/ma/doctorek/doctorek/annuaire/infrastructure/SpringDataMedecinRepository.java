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

    @Query("""
        SELECT u FROM User u
        WHERE u.role = 'MEDECIN' AND u.active = true
        AND (:specialite IS NULL OR LOWER(u.specialite) LIKE LOWER(CONCAT('%', :specialite, '%')))
        AND (:ville IS NULL OR LOWER(u.ville) LIKE LOWER(CONCAT('%', :ville, '%')))
        """)
    List<User> searchActiveMedecins(@Param("specialite") String specialite,
                                    @Param("ville") String ville);
}
