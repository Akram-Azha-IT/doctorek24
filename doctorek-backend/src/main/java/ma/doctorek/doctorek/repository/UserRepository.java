package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByKeycloakId(String keycloakId);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    long countByRole(Role role);
    long countByRoleAndStatus(Role role, UserStatus status);

    /**
     * Photos de profil de plusieurs utilisateurs en une seule requête (évite un N+1 dans
     * les listes). La photo téléversée prime — côté médecin ou patient selon le rôle —
     * puis l'avatar du compte (connexion Google) sert de repli.
     */
    @Query(value = """
        SELECT CAST(u.id AS VARCHAR) AS "userId",
               COALESCE(NULLIF(md.photo_url, ''), NULLIF(pd.photo_url, ''), u.avatar_url) AS "photoUrl"
        FROM auth.users u
        LEFT JOIN annuaire.medecin_details md ON md.user_id = u.id
        LEFT JOIN patient.patient_details pd ON pd.user_id = u.id
        WHERE u.id IN (:ids)
        """, nativeQuery = true)
    List<ProfilePhotoProjection> findPhotoUrls(@Param("ids") Collection<UUID> ids);

    @Query("SELECT u FROM User u WHERE u.status = ma.doctorek.doctorek.enums.UserStatus.ACTIVE AND u.role IN :roles AND " +
           "(:search = '' OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findByRoleInWithSearch(
            @Param("roles") List<Role> roles,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.status = ma.doctorek.doctorek.enums.UserStatus.ACTIVE AND u.role IN :roles AND " +
           "(:search = '' OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    long countByRoleInWithSearch(
            @Param("roles") List<Role> roles,
            @Param("search") String search);
}
