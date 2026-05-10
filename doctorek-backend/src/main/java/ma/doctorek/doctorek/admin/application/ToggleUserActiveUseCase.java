package ma.doctorek.doctorek.admin.application;

import ma.doctorek.doctorek.auth.domain.User;
import ma.doctorek.doctorek.auth.domain.UserNotFoundException;
import ma.doctorek.doctorek.auth.domain.UserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ToggleUserActiveUseCase {

    private final UserRepository userRepository;

    public ToggleUserActiveUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void execute(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        user.setActive(!user.isActive());
        userRepository.save(user);
    }
}
