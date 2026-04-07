package ma.doctorek.doctorek.auth.infrastructure;

import ma.doctorek.doctorek.auth.domain.User;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import org.springframework.stereotype.Repository;

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
    public boolean existsByInpe(String inpe) {
        return delegate.existsByInpe(inpe);
    }
}
