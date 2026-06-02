package ma.doctorek.doctorek.exception;

public class PhoneAlreadyExistsException extends RuntimeException {
    public PhoneAlreadyExistsException(String phone) {
        super("Phone already registered: " + phone);
    }
}
