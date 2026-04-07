package ma.doctorek.doctorek.annuaire.infrastructure;

import ma.doctorek.doctorek.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

interface SpringDataMedecinRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.role = 'MEDECIN' AND u.active = true")
    Optional<User> findActiveMedecinById(@Param("id") UUID id);
}
