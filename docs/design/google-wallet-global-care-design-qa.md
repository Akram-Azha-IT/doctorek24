# Design QA — Google Wallet « Global Care »

## Preuves

- Vérité visuelle : `C:\Users\Akram\.codex\generated_images\01a01075-fbdd-78f3-9624-28505d60d2be\exec-cefdc12c-cb45-470c-8e74-833b24a9cf67.png`
- Vérité visuelle : 853 × 1844 px ; carte recadrée à 668 × 1339 px.
- Capture Wallet réelle avant correction : `C:\Users\Akram\AppData\Local\Temp\codex-clipboard-eb1e7b07-e44d-4e87-b3e4-951d9f214dc6.png`
- Capture réelle : 1029 × 668 px ; carte recadrée à 364 × 580 px.
- Comparaison normalisée avant correction : `C:\Users\Akram\AppData\Local\Temp\doctorek-wallet-comparison-before.png`
- État : patient connecté, pass Google Wallet ouvert sur le Web, carte active.
- Densité : les deux cartes ont été recadrées puis ramenées à une largeur commune de 340 px sans déformation.

La comparaison focalisée sur la carte suffit pour juger la hiérarchie, l'ordre des blocs, le hero, le nom et le QR. Le chrome Google Wallet et le panneau Détails sont exclus de la comparaison de fidélité du recto.

## Constats avant correction

- [P1] Le QR était placé avant l'illustration alors que la maquette exige l'ordre `hero → N° adhérent / Statut → QR`.
- [P1] Les champs `N° adhérent` et `Statut` étaient absents du recto et relégués dans le panneau Détails.
- [P2] Le nom de famille était forcé en majuscules (`BENHAMMOU`) au lieu du rendu approuvé (`Benhammou`).
- [P3] Google Wallet contrôle la police, la taille finale du logo, les espacements, les rayons et le cadre externe ; ces éléments ne peuvent pas être reproduits pixel pour pixel par l'émetteur.

## Correctifs implémentés

- Synchronisation OAuth du `GenericClass` existant avec l'API officielle Google Wallet.
- `classTemplateInfo.cardTemplateOverride` limité à une ligne de deux champs : `N° adhérent` et `Statut`.
- L'unique ligne personnalisée force Google Wallet à placer le hero avant les champs, puis le QR.
- `detailsTemplateOverride` conserve `N° adhérent`, `Statut` et `Couverture` dans la vue Détails.
- Normalisation typographique du nom pour obtenir `Akram Benhammou`.
- Version de design `v4-global-care-template` afin que Google crée un nouvel objet avec la casse corrigée au lieu de réutiliser l'ancien payload immuable.
- Mise en cache du gabarit et du jeton OAuth afin de ne pas appeler Google à chaque génération de carte.
- Création automatique de la classe si elle n'existe pas ; mise à jour sinon.

## Surfaces de fidélité

- Typographie : contenu et casse corrigés ; famille, taille et interlignage restent gérés par Google Wallet.
- Mise en page : ordre des grandes régions corrigé par le gabarit de classe ; rayons et marges restent gérés par Google.
- Couleurs : fond `#216ACF`, blanc et hero bleu clair inchangés et conformes à la maquette.
- Images : logo Doctorek et hero `wallet-hero-global-care.png` réutilisés sans approximation ni remplacement.
- Contenu : hiérarchie `Doctorek → Carte santé → nom → hero → adhérent/statut → QR` restaurée ; couverture conservée dans Détails.

## Vérification automatisée

- `GoogleWalletClassServiceTest` : gabarit à une ligne, références de champs, PATCH, création sur 404 et cache vérifiés.
- `GoogleWalletServiceTest` : payload, assets, couleur, contenu non sensible et appel de synchronisation vérifiés.
- Résultat : 4 tests exécutés, 0 échec, 0 erreur, 1 test de contexte préexistant ignoré.

## Historique de comparaison

### Itération 1 — code corrigé, rendu externe à revalider

La comparaison source/rendu réel a révélé les P1/P2 ci-dessus. Le gabarit de classe et la casse du nom ont été corrigés. Une nouvelle capture ne peut être produite localement : le rendu final n'existe qu'après déploiement, synchronisation du `GenericClass` dans Google Wallet et actualisation du pass du compte utilisateur.

## Blocage restant

La recette visuelle finale nécessite le prochain déploiement puis une nouvelle capture du même pass. Tant que cette capture Google Wallet post-correction n'est pas disponible, les P1 sont corrigés dans le payload et testés, mais ne peuvent pas être certifiés visuellement.

final result: blocked
