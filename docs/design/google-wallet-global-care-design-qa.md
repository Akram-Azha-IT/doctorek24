# Design QA — Google Wallet « Global Care »

## Cible visuelle

- Référence choisie : `C:\Users\Akram\.codex\generated_images\01a01075-fbdd-78f3-9624-28505d60d2be\exec-cefdc12c-cb45-470c-8e74-833b24a9cf67.png`
- Intégration : pass Google Wallet générique généré par `GoogleWalletService`.
- Direction : fond Doctorek bleu `#216ACF`, identité compacte, hero abstrait santé, informations essentielles, QR et lien vers l'espace patient.

## Vérifications réalisées

- Payload JWT Google Wallet : test automatisé réussi.
- Hero : PNG 1032 × 812, sans texte, sans photo et sans donnée patient.
- Logo : PNG 840 × 840 avec marge de sécurité.
- Hiérarchie : `Doctorek` → `Carte santé` → nom du patient.
- Champs : `N° adhérent`, `Statut`, `Couverture`.
- Action : `Ouvrir Doctorek` vers l'espace carte du patient.
- Données sensibles : CIN, numéro CNSS/AMO et photo absents du payload du nouveau pass.
- Ancienne image patient supprimée pour éviter le grand panneau d'initiale/photo vu dans le rendu précédent.
- Identifiant de design versionné (`v3-global-care`) afin que Google crée le nouveau pass au lieu de réutiliser l'ancien objet.

## Vérification automatisée

- Commande : `.\mvnw.cmd -Dtest=GoogleWalletServiceTest test`
- Résultat : 1 test, 0 échec, 0 erreur.
- `git diff --check` : réussi, avertissement de fin de ligne uniquement.

## Limite de validation visuelle

Le rendu final est composé par Google Wallet. Une capture réelle du nouveau pass nécessite d'ouvrir l'URL « Save to Google Wallet », ce qui transmet les données du pass à Google et ajoute un objet au compte de l'utilisateur. Cette action externe n'a pas été déclenchée automatiquement.

En développement local, Google ne peut pas télécharger les nouveaux assets depuis `localhost`. Le hero et le logo Doctorek complets sont donc activés lorsque `app.frontend-url` pointe vers le domaine HTTPS public de Doctorek.

## Étape de recette manuelle

1. Démarrer l'application avec un `FRONTEND_URL` HTTPS public.
2. Supprimer l'ancienne carte Wallet si elle est encore enregistrée.
3. Depuis l'espace patient, utiliser « Ajouter à Google Wallet ».
4. Vérifier le hero, le nom, les trois champs, le QR et l'action « Ouvrir Doctorek ».

**final result: blocked — validation visuelle Google Wallet réelle requise**
