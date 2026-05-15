package ma.doctorek.doctorek.auth.domain;

public interface MedecinProfileCreatePort {
    void create(User user, String inpe, String specialite, String ville, String adresse);
    boolean existsByInpe(String inpe);
}
