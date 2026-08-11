package ma.doctorek.doctorek.repository;

import java.time.Instant;
import java.util.UUID;

/**
 * Avis enrichi du nom de son auteur.
 *
 * <p>Le prénom et le nom remontent bruts : c'est la couche DTO qui décide de les
 * afficher ou de les remplacer par « Patient vérifié », selon le choix du patient.
 */
public interface AvisProjection {
    UUID getId();
    short getNote();
    String getCommentaire();
    boolean getAnonyme();
    String getStatut();
    Instant getCreatedAt();
    String getPrenom();
    String getNom();
}
