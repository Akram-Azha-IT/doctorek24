# US-F12 — Rappels automatiques par email

## Description

> En tant que **patient**, je veux recevoir un email de confirmation à la prise de rendez-vous puis un rappel la veille (J-1) et l'avant-veille (J-2), afin de ne pas oublier ma consultation.

> En tant que **médecin**, je veux que mes patients soient notifiés automatiquement, afin de réduire le taux d'absentéisme (no-show).

## Critères d'acceptation

- À chaque création de RDV via `POST /api/v1/agenda/rdv`, un email de confirmation est envoyé au patient.
- Un job planifié s'exécute chaque jour à **08:00** et envoie :
  - un rappel **J-1** (RDV de demain),
  - un rappel **J-2** (RDV d'après-demain).
- Les RDV au statut `ANNULE` ne génèrent **aucun rappel**.
- Les emails utilisent la locale **française** : date `EEEE d MMMM yyyy` et heure `HH'h'mm`.
- L'envoi peut être désactivé en environnement local via `doctorek.mail.enabled=false`.
- Les erreurs SMTP sont **loggées** mais n'interrompent pas le flux métier (création RDV ou cron).
- Côté frontend, après une prise de RDV réussie, une pastille de confirmation rappelle au patient qu'un email lui a été envoyé.

## Architecture du module `notification`

```
notification/
├── application/
│   ├── EmailService.java          # Envoi des emails (confirmation + rappel)
│   └── RappelScheduler.java       # Job @Scheduled J-1 / J-2
└── infrastructure/
    └── (configuration Spring Mail)
```

## Configuration

```properties
# doctorek-backend/src/main/resources/application.properties
spring.mail.host=${SMTP_HOST:localhost}
spring.mail.port=${SMTP_PORT:1025}
spring.mail.username=${SMTP_USER:}
spring.mail.password=${SMTP_PASS:}

doctorek.mail.from=no-reply@doctorek.ma
doctorek.mail.enabled=true
doctorek.mail.rappel-cron=0 0 8 * * *
```

| Clé                          | Rôle                                                       |
|------------------------------|------------------------------------------------------------|
| `doctorek.mail.from`         | Adresse expéditeur des emails                              |
| `doctorek.mail.enabled`      | Désactive l'envoi en local / tests (no-op si `false`)      |
| `doctorek.mail.rappel-cron`  | Cron du scheduler (défaut : 08:00 chaque jour)             |

## Service d'envoi — `EmailService`

```java
@Service
public class EmailService {

    public void sendConfirmationRdv(String toEmail, RendezVous rdv) {
        // Sujet : "Confirmation de votre rendez-vous — Doctorek"
        // Corps : date FR + heure FR + numéro de RDV
    }

    public void sendRappelRdv(String toEmail, RendezVous rdv, int joursAvant) {
        // joursAvant == 1 → "Rappel : votre rendez-vous demain"
        // joursAvant >= 2 → "Rappel : votre rendez-vous dans N jours"
    }
}
```

- Utilise `JavaMailSender` injecté par Spring Boot.
- Les erreurs `MailException` sont **loggées via SLF4J** mais jamais propagées.
- Si `doctorek.mail.enabled=false`, la méthode retourne immédiatement (utile pour les tests).

## Scheduler — `RappelScheduler`

```java
@Component
public class RappelScheduler {

    @Scheduled(cron = "${doctorek.mail.rappel-cron:0 0 8 * * *}")
    public void envoyerRappelsQuotidiens() {
        LocalDate today = LocalDate.now();
        envoyerRappelsPourDate(today.plusDays(1), 1); // J-1
        envoyerRappelsPourDate(today.plusDays(2), 2); // J-2
    }
}
```

Le scheduler appelle `rdvRepo.findByDateAndStatutNot(date, StatutRdv.ANNULE)` pour récupérer les RDV éligibles, puis `userRepo.findById(rdv.patientId())` pour obtenir l'email destinataire.

`@EnableScheduling` est activé sur la classe principale `DoctorekApplication`.

## Intégration dans `PrendreRdvUseCase`

```java
public RendezVous execute(PrendreRdvCommand cmd) {
    // ... validation + création du RDV ...
    var saved = rdvRepo.save(rdv);
    emailService.sendConfirmationRdv(patient.email(), saved);
    return saved;
}
```

L'envoi est exécuté **après** persistance pour ne pas envoyer un email pour un RDV qui n'aurait pas été enregistré.

## Composants React impliqués (frontend)

| Composant                                                        | Rôle                                                                  |
|------------------------------------------------------------------|-----------------------------------------------------------------------|
| `features/agenda/components/RdvSuccessCard.tsx`                  | Affiche la pastille « Un email de confirmation vous a été envoyé. »   |
| `app/medecins/[id]/rdv/page.tsx`                                 | Affiche `<RdvSuccessCard>` après mutation `usePrendreRdv` réussie     |

## Composants Java impliqués (backend)

| Composant                                                                              | Rôle                                          |
|----------------------------------------------------------------------------------------|-----------------------------------------------|
| `notification/application/EmailService.java`                                           | Construction et envoi des emails              |
| `notification/application/RappelScheduler.java`                                        | Cron quotidien J-1 / J-2                      |
| `agenda/application/PrendreRdvUseCase.java`                                            | Hook : envoi de la confirmation post-save     |
| `agenda/infrastructure/JpaRendezVousRepository.java` + `SpringDataRendezVousRepository` | Méthode `findByDateAndStatutNot`              |
| `DoctorekApplication.java`                                                             | `@EnableScheduling`                           |

## Tests manuels de validation

1. **Confirmation à la création :**
   - Démarrer un serveur SMTP local (MailHog sur `localhost:1025`).
   - Créer un RDV via le frontend → vérifier qu'un email arrive dans MailHog avec sujet *« Confirmation de votre rendez-vous — Doctorek »* et la date au format français.
2. **Désactivation locale :**
   - Mettre `doctorek.mail.enabled=false` → la prise de RDV doit fonctionner sans erreur, aucun email envoyé.
3. **Rappel J-1 :**
   - Insérer un RDV dont `dateRdv = today + 1` et statut `EN_ATTENTE`.
   - Déclencher manuellement `RappelScheduler.envoyerRappelsQuotidiens()` (test unitaire ou cron rapproché) → vérifier l'email *« Rappel : votre rendez-vous demain »*.
4. **Rappel J-2 :**
   - Idem avec `dateRdv = today + 2` → vérifier *« dans 2 jours »*.
5. **Filtre statut ANNULE :**
   - Insérer un RDV `dateRdv = today + 1` au statut `ANNULE` → aucun rappel envoyé.
6. **Tolérance aux erreurs SMTP :**
   - Couper le serveur SMTP, créer un RDV → la création réussit, l'erreur est loggée.
7. **Frontend :**
   - Après prise de RDV, vérifier la présence de la pastille verte avec l'icône d'enveloppe.

## Capture d'écran

`docs/captures/us-f12-email-confirmation.png`
`docs/captures/us-f12-rdv-success-pill.png`
