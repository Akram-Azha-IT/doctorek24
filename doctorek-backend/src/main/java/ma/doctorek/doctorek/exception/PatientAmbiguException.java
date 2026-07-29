package ma.doctorek.doctorek.exception;

import org.springframework.http.HttpStatus;

/**
 * Plusieurs dossiers portent la même identité chez ce médecin.
 *
 * <p>Le praticien doit désigner le dossier concerné : deviner reviendrait à risquer
 * d'écrire dans le dossier médical d'une autre personne.
 */
public class PatientAmbiguException extends AppException {
    public PatientAmbiguException(String identite) {
        super("Plusieurs dossiers existent pour " + identite
            + ". Sélectionnez le patient concerné dans la liste.", HttpStatus.CONFLICT);
    }
}
