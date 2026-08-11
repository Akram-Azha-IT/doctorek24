package ma.doctorek.doctorek.repository;

import java.util.UUID;

/** Note agrégée d'un médecin — une ligne par médecin ayant au moins un avis visible. */
public interface NoteMedecinProjection {
    UUID getMedecinId();
    double getMoyenne();
    long getTotal();
}
