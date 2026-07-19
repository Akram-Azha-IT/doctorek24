package ma.doctorek.doctorek.dto;

public record CreerRdvMedecinResponse(
        RendezVousResponse rdv,
        boolean emailRattachementEnvoye) {
}
