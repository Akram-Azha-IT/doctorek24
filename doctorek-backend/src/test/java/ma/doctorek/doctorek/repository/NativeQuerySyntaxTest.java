package ma.doctorek.doctorek.repository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Garde-fou sur les requêtes natives.
 *
 * <p>Spring Data analyse la chaîne d'une requête native pour y repérer les paramètres
 * nommés, sans interpréter les commentaires SQL. Une apostrophe dans un commentaire
 * ouvre donc un littéral qui ne se referme jamais : le repository n'est pas créé et le
 * contexte Spring échoue <em>au démarrage</em>.
 *
 * <p>Ce test existe parce que le cas s'est produit en production : les tests unitaires
 * utilisent des mocks et le test de contexte est désactivé (il exige PostgreSQL et Redis),
 * donc rien ne couvrait le démarrage. À défaut de démarrer le contexte, on vérifie ici la
 * seule propriété syntaxique qui l'avait fait tomber.
 */
class NativeQuerySyntaxTest {

    private static final Path SOURCES = Path.of("src/main/java");
    private static final Pattern TEXT_BLOCK_QUERY =
            Pattern.compile("@Query\\(value = \"\"\"(.*?)\"\"\"", Pattern.DOTALL);

    private record Offender(String file, String detail) {
        @Override
        public String toString() {
            return file + " → " + detail;
        }
    }

    private static List<Offender> scan() throws IOException {
        List<Offender> offenders = new ArrayList<>();
        try (Stream<Path> files = Files.walk(SOURCES)) {
            for (Path file : files.filter(p -> p.toString().endsWith(".java")).toList()) {
                String source = Files.readString(file, StandardCharsets.UTF_8);
                Matcher m = TEXT_BLOCK_QUERY.matcher(source);
                while (m.find()) {
                    inspect(file.getFileName().toString(), m.group(1), offenders);
                }
            }
        }
        return offenders;
    }

    private static void inspect(String fileName, String query, List<Offender> offenders) {
        for (String line : query.lines().toList()) {
            String trimmed = line.strip();
            if (trimmed.startsWith("--") && trimmed.contains("'")) {
                offenders.add(new Offender(fileName, "apostrophe dans un commentaire SQL : " + trimmed));
            }
        }
        if (query.chars().filter(c -> c == '\'').count() % 2 != 0) {
            offenders.add(new Offender(fileName, "nombre impair d'apostrophes dans la requête"));
        }
    }

    @Test
    @DisplayName("aucune requête native ne contient d'apostrophe piégeuse")
    void nativeQueries_haveNoUnterminatedQuote() throws IOException {
        assertThat(scan())
                .as("Spring Data ne saurait pas créer ces repositories : le contexte échouerait au démarrage")
                .isEmpty();
    }
}
