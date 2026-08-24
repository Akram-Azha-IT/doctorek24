package ma.doctorek.doctorek.agent.dto;

import ma.doctorek.doctorek.dto.CreneauResponse;
import ma.doctorek.doctorek.dto.MedecinProfile;

import java.time.LocalDate;
import java.util.List;

/**
 * Créneaux d'un médecin sur plusieurs jours, groupés par date.
 *
 * <p>Le regroupement est fait côté serveur pour que le modèle n'ait qu'un seul
 * appel d'outil à faire pour « cette semaine » : une question courante qui,
 * jour par jour, consommerait sept tours de boucle.
 *
 * <p>Porte le profil complet du praticien, et pas seulement son nom : au clic sur
 * un créneau, le frontend ouvre le tiroir de réservation existant, qui attend un
 * {@code MedecinProfile}. Sans lui, il faudrait une requête supplémentaire au
 * moment précis où le patient s'engage. Cette carte n'est jamais transmise au
 * modèle, seulement au navigateur : l'enrichir ne coûte aucun jeton.
 */
public record CreneauxCarte(
        MedecinProfile medecin,
        List<JourCreneaux> jours) {

    public record JourCreneaux(LocalDate date, List<CreneauResponse> creneaux) {
    }
}
