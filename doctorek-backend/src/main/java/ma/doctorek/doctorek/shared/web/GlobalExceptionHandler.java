package ma.doctorek.doctorek.shared.web;

import ma.doctorek.doctorek.agenda.domain.CreneauIndisponibleException;
import ma.doctorek.doctorek.agenda.domain.DisponibiliteNotFoundException;
import ma.doctorek.doctorek.agenda.domain.MedecinSansAgendaException;
import ma.doctorek.doctorek.agenda.domain.RendezVousNotFoundException;
import ma.doctorek.doctorek.agenda.domain.RdvNonAnnulableException;
import ma.doctorek.doctorek.agenda.domain.RdvNonConfirmableException;
import ma.doctorek.doctorek.agenda.domain.RdvNonTerminableException;
import ma.doctorek.doctorek.annuaire.domain.MedecinNotFoundException;
import ma.doctorek.doctorek.auth.domain.EmailAlreadyExistsException;
import ma.doctorek.doctorek.auth.domain.InpeAlreadyExistsException;
import ma.doctorek.doctorek.auth.domain.InvalidVerificationCodeException;
import ma.doctorek.doctorek.auth.domain.PhoneAlreadyExistsException;
import ma.doctorek.doctorek.auth.domain.UserNotFoundException;
import ma.doctorek.doctorek.auth.domain.VerificationCodeExpiredException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleEmailConflict(EmailAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(PhoneAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handlePhoneConflict(PhoneAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InpeAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleInpeConflict(InpeAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(MedecinNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleMedecinNotFound(MedecinNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(DisponibiliteNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleDisponibiliteNotFound(DisponibiliteNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(MedecinSansAgendaException.class)
    public ResponseEntity<ApiResponse<Void>> handleMedecinSansAgenda(MedecinSansAgendaException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(RendezVousNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleRendezVousNotFound(RendezVousNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(CreneauIndisponibleException.class)
    public ResponseEntity<ApiResponse<Void>> handleCreneauIndisponible(CreneauIndisponibleException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(RdvNonAnnulableException.class)
    public ResponseEntity<ApiResponse<Void>> handleRdvNonAnnulable(RdvNonAnnulableException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(RdvNonConfirmableException.class)
    public ResponseEntity<ApiResponse<Void>> handleRdvNonConfirmable(RdvNonConfirmableException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(RdvNonTerminableException.class)
    public ResponseEntity<ApiResponse<Void>> handleRdvNonTerminable(RdvNonTerminableException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InvalidVerificationCodeException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidCode(InvalidVerificationCodeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(VerificationCodeExpiredException.class)
    public ResponseEntity<ApiResponse<Void>> handleExpiredCode(VerificationCodeExpiredException ex) {
        return ResponseEntity.status(HttpStatus.GONE).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
            .body(ApiResponse.error("Méthode HTTP non supportée : " + ex.getMethod()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = "Paramètre invalide: '" + ex.getName() + "' doit être un UUID valide";
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("An unexpected error occurred"));
    }
}
