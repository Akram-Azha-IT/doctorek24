package ma.doctorek.doctorek.auth.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    User save(User user);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findById(UUID id);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByInpe(String inpe);

    long countByRole(Role role);
    List<User> findByRoleInWithSearch(List<Role> roles, String search, int page, int size);
    long countByRoleInWithSearch(List<Role> roles, String search);
}
