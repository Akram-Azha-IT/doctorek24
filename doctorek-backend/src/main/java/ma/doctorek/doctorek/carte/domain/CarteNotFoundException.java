package ma.doctorek.doctorek.carte.domain;

public class CarteNotFoundException extends RuntimeException {
    public CarteNotFoundException(String message) {
        super(message);
    }
}
