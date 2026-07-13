package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.dto.PatientDetailRequest;
import ma.doctorek.doctorek.dto.PatientDetailResponse;
import ma.doctorek.doctorek.entity.PatientDetailEntity;
import ma.doctorek.doctorek.entity.User;
import ma.doctorek.doctorek.exception.UserNotFoundException;
import ma.doctorek.doctorek.repository.PatientDetailRepository;
import ma.doctorek.doctorek.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PatientDetailService {

    private final PatientDetailRepository repository;
    private final UserRepository userRepository;

    public PatientDetailService(PatientDetailRepository repository,
                                UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PatientDetailResponse getByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Patient non trouvé: " + userId));

        PatientDetailEntity detail = repository.findById(userId)
                .orElseGet(() -> new PatientDetailEntity(user));

        // Fall back to the social-login avatar when no photo was uploaded.
        return PatientDetailResponse.from(detail, user.getFirstName(), user.getLastName(),
                user.getAvatarUrl());
    }

    @Transactional
    public PatientDetailResponse upsert(UUID userId, PatientDetailRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Patient non trouvé: " + userId));

        PatientDetailEntity entity = repository.findById(userId)
                .orElseGet(() -> new PatientDetailEntity(user));

        entity.setDateNaissance(req.dateNaissance());
        entity.setGenre(req.genre());
        entity.setNationalite(req.nationalite());
        entity.setNumIdentite(req.numIdentite());
        entity.setPhotoUrl(req.photoUrl());
        entity.setTelephone(req.telephone());
        entity.setAdresseRue(req.adresseRue());
        entity.setAdresseVille(req.adresseVille());
        entity.setAdressePays(req.adressePays());

        PatientDetailEntity saved = repository.save(entity);
        return PatientDetailResponse.from(saved, user.getFirstName(), user.getLastName());
    }
}
