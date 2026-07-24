package ma.doctorek.doctorek.dto;

/**
 * Jeton d'accès court délivré après OTP validé. À présenter (header X-Carte-Access)
 * pour lire la partie sensible de la carte pendant sa durée de vie.
 */
public record CarteAccessResponse(String accessToken, long expiresInSec) {}
