package ma.doctorek.doctorek.dto;

/**
 * Réponse à une demande d'OTP : destination masquée (ex. "a***@gmail.com") pour que
 * le scanneur sache où le code a été envoyé, sans révéler l'email complet du patient.
 */
public record OtpChallengeResponse(String maskedDestination, long expiresInSec) {}
