package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.entity.ConsentementEntity;
import ma.doctorek.doctorek.enums.Role;
import ma.doctorek.doctorek.enums.SourceConsentement;
import ma.doctorek.doctorek.repository.ConsentementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Consentement au traitement des données personnelles (loi 09-08).
 *
 * <p>Le consentement porte sur une <em>version</em> du texte : republier la politique de
 * confidentialité en changeant la version redemande l'accord à tout le monde. Sans cette
 * notion, un texte réécrit s'appliquerait rétroactivement à des gens qui ont accepté autre
 * chose.
 *
 * <p>Ne concerne que les comptes patients : ce sont eux dont les données de santé sont
 * traitées. Un praticien est un utilisateur professionnel de l'outil, pas la personne
 * concernée par le dossier.
 */
@Service
public class ConsentementService {

    private static final Logger log = LoggerFactory.getLogger(ConsentementService.class);

    private final ConsentementRepository repo;

    /** Version courante du texte. La changer redemande l'accord à tous les patients. */
    @Value("${doctorek.consentement.version:2026-08-10}")
    private String versionCourante;

    public ConsentementService(ConsentementRepository repo) {
        this.repo = repo;
    }

    public String versionCourante() {
        return versionCourante;
    }

    /** Un accord doit-il être demandé à ce compte avant qu'il n'utilise l'app ? */
    @Transactional(readOnly = true)
    public boolean consentementRequis(UUID userId, Role role) {
        if (role != Role.PATIENT) return false;
        return !repo.existsByUserIdAndVersion(userId, versionCourante);
    }

    /**
     * Enregistre l'accord d'un compte pour la version courante.
     *
     * <p>Rejouer l'appel ne crée pas de doublon : l'index unique tranche, et un second
     * envoi vaut confirmation du même accord, pas une contradiction.
     */
    @Transactional
    public void enregistrer(UUID userId, SourceConsentement source) {
        if (repo.existsByUserIdAndVersion(userId, versionCourante)) return;
        try {
            repo.save(ConsentementEntity.builder()
                .userId(userId)
                .version(versionCourante)
                .source(source.name())
                .build());
        } catch (DataIntegrityViolationException e) {
            log.debug("Consentement déjà enregistré pour {} en version {}", userId, versionCourante);
        }
    }
}
