package ma.doctorek.doctorek.util;

import java.text.Normalizer;

/** Normalisation des noms français : minuscules, sans accents (É→e, ç→c). */
public final class Noms {

    private Noms() {
    }

    public static String normaliser(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase();
    }

    public static boolean identiques(String a, String b) {
        return !normaliser(a).isEmpty() && normaliser(a).equals(normaliser(b));
    }
}
