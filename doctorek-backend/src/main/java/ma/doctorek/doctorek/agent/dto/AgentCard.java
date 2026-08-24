package ma.doctorek.doctorek.agent.dto;

/**
 * Bloc riche affiché dans le fil de conversation, à côté de la phrase du modèle.
 *
 * <p><strong>Invariant du module :</strong> le contenu d'une carte provient
 * toujours du retour réel d'un service métier, jamais du texte généré. Le modèle
 * choisit quel outil appeler ; il n'écrit pas les données affichées. Un nom de
 * médecin, une adresse, un horaire ou une note ne peuvent donc pas être inventés.
 *
 * @param type    identifiant de rendu côté frontend : {@code medecins}, {@code medecin},
 *                {@code creneaux}, {@code rdvs}, {@code brouillon}
 * @param donnees charge utile typée, sérialisée telle quelle en JSON
 */
public record AgentCard(String type, Object donnees) {

    public static final String TYPE_MEDECINS = "medecins";
    public static final String TYPE_MEDECIN = "medecin";
    public static final String TYPE_CRENEAUX = "creneaux";
    public static final String TYPE_RDVS = "rdvs";
    public static final String TYPE_BROUILLON = "brouillon";
}
