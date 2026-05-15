package ma.doctorek.doctorek.auth.infrastructure;

import ma.doctorek.doctorek.auth.domain.Role;
import ma.doctorek.doctorek.auth.domain.User;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaUserRepository implements UserRepository {

    private final SpringDataUserRepository delegate;

    public JpaUserRepository(SpringDataUserRepository delegate) {
        this.delegate = delegate;
    }

    @Override
    public User save(User user) {
        return delegate.save(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return delegate.findByEmail(email);
    }

    @Override
    public Optional<User> findByPhone(String phone) {
        return delegate.findByPhone(phone);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return delegate.findById(id);
    }

    @Override
    public boolean existsByEmail(String email) {
        return delegate.existsByEmail(email);
    }

    @Override
    public boolean existsByPhone(String phone) {
        return delegate.existsByPhone(phone);
    }

    @Override
    public long countByRole(Role role) {
        return delegate.countByRole(role);
    }

    @Override
    public List<User> findByRoleInWithSearch(List<Role> roles, String search, int page, int size) {
        return delegate.findByRoleInWithSearch(
                roles,
                search == null ? "" : search.trim(),
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        ).getContent();
    }

    @Override
    public long countByRoleInWithSearch(List<Role> roles, String search) {
        return delegate.findByRoleInWithSearch(
                roles,
                search == null ? "" : search.trim(),
                PageRequest.of(0, Integer.MAX_VALUE)
        ).getTotalElements();
    }
}
