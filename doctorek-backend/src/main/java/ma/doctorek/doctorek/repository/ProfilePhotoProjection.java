package ma.doctorek.doctorek.repository;

/** Photo de profil résolue pour un utilisateur, quel que soit son rôle. */
public interface ProfilePhotoProjection {
    String getUserId();
    String getPhotoUrl();
}
