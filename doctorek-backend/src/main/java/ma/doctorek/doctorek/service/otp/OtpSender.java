package ma.doctorek.doctorek.service.otp;

/**
 * Canal d'envoi d'un code OTP. Abstraction pour pouvoir ajouter le SMS plus tard
 * sans toucher à la logique métier (seul l'email est implémenté pour l'instant).
 */
public interface OtpSender {

    /** Envoie le code à la destination du patient (ex. son email). */
    void send(String destination, String code, String patientName);

    /** Identifiant du canal, pour les logs et le futur routage multi-canal. */
    String channel();
}
