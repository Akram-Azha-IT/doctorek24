package ma.doctorek.doctorek.auth.domain;

public class PhoneAlreadyExistsException extends RuntimeException {
    public PhoneAlreadyExistsException(String phone) {
        super("Phone number already registered: " + phone);
    }
}
