package ma.doctorek.doctorek.repository;

/** Nombre d'avis pour une note donnée — une ligne par valeur réellement attribuée. */
public interface RepartitionNotesProjection {
    short getNote();
    long getTotal();
}
