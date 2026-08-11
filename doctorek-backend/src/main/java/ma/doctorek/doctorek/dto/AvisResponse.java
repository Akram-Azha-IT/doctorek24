package ma.doctorek.doctorek.dto;

import ma.doctorek.doctorek.entity.AvisEntity;
import ma.doctorek.doctorek.repository.AvisProjection;

import java.time.Instant;
import java.util.UUID;

/**
 * Avis tel qu'il s'affiche publiquement.
 *
 * <p>Ne porte jamais l'identifiant du patient : le profil médecin est une page publique,
 * et relier un nom à une consultation est une donnée de santé. L'auteur y est réduit à
 * un libellé — prénom et initiale, ou « Patient vérifié » si le patient a choisi l'anonymat.
 */
public record AvisResponse(
        UUID id,
        int note,
        String commentaire,
        String auteur,
        boolean anonyme,
        String statut,
        Instant createdAt) {

    private static final String AUTEUR_ANONYME = "Patient vérifié";

    public static AvisResponse from(AvisProjection p) {
        return new AvisResponse(
            p.getId(),
            p.getNote(),
            p.getCommentaire(),
            libelleAuteur(p.getAnonyme(), p.getPrenom(), p.getNom()),
            p.getAnonyme(),
            p.getStatut(),
            p.getCreatedAt());
    }

    /** Réponse au dépôt : l'auteur est celui qui vient d'écrire, inutile de le renommer. */
    public static AvisResponse from(AvisEntity a, String prenom, String nom) {
        return new AvisResponse(
            a.getId(),
            a.getNote(),
            a.getCommentaire(),
            libelleAuteur(a.isAnonyme(), prenom, nom),
            a.isAnonyme(),
            a.getStatut(),
            a.getCreatedAt());
    }

    /**
     * « Akram B. » plutôt que le nom complet : assez pour incarner l'avis, pas assez
     * pour identifier un patient sur une page publique.
     */
    private static String libelleAuteur(boolean anonyme, String prenom, String nom) {
        if (anonyme) return AUTEUR_ANONYME;
        String prenomAffiche = prenom == null ? "" : prenom.trim();
        String nomAffiche = nom == null ? "" : nom.trim();
        if (prenomAffiche.isEmpty()) return AUTEUR_ANONYME;
        if (nomAffiche.isEmpty()) return prenomAffiche;
        return prenomAffiche + " " + nomAffiche.charAt(0) + ".";
    }
}
