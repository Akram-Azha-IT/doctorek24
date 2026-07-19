package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

public class RattachementInvalideException extends AppException {
    public RattachementInvalideException(String message, HttpStatus status) {
        super(message, status);
    }

    public static RattachementInvalideException introuvable() {
        return new RattachementInvalideException("Lien de rattachement introuvable", HttpStatus.NOT_FOUND);
    }

    public static RattachementInvalideException expire() {
        return new RattachementInvalideException("Ce lien de rattachement a expiré", HttpStatus.GONE);
    }

    public static RattachementInvalideException dejaUtilise() {
        return new RattachementInvalideException("Ce lien de rattachement a déjà été utilisé", HttpStatus.GONE);
    }

    public static RattachementInvalideException bloque() {
        return new RattachementInvalideException(
            "Trop de tentatives — ce lien de rattachement est bloqué", HttpStatus.GONE);
    }

    public static RattachementInvalideException lettresIncorrectes(int tentativesRestantes) {
        return new RattachementInvalideException(
            "Les lettres saisies ne correspondent pas (" + tentativesRestantes + " tentative(s) restante(s))",
            HttpStatus.BAD_REQUEST);
    }
}
