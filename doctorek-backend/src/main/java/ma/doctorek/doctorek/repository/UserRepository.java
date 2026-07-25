package ma.doctorek.doctorek.repository;

import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
