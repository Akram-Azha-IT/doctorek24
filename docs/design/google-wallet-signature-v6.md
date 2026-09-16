# Google Wallet — Signature v6

Date : 15 septembre 2026. Implémentation locale, sans déploiement ni modification de pass réel.

## Direction

Fond médical Doctorek `#042651`, logo existant conservé et illustration de continuité des soins : ruban bleu sculptural, lumière douce, espace négatif. Pas de texte incorporé, de faux label de certification, de données cliniques ni de QR décoratif. Le nom, la référence et le QR restent des éléments natifs Wallet. La carte web/mobile n'est pas remplacée.

La hiérarchie et les dimensions finales restent contrôlées par Google Wallet ; l'illustration n'est pas une capture du rendu final. Le template de classe existant reste inchangé.

## Références consultées

- [Google Wallet : recommandations officielles](https://developers.google.com/wallet/generic/resources/brand-guidelines) : image proche de 5:4, sans texte intégré, espace de respiration, champs courts.
- [Google Wallet : templates](https://developers.google.com/wallet/generic/resources/template) : structure native et champs personnalisables.
- [Dribbble : membership passes](https://dribbble.com/search/membership-pass) : exploration visuelle, pas preuve d'utilisabilité ni modèle copié.
- [Apple Wallet HIG](https://developer.apple.com/design/human-interface-guidelines/wallet) : page trouvée mais contenu inaccessible sans JavaScript ; aucune exigence technique dérivée de cette page.

## Asset

`doctorek-frontend/public/wallet-hero-signature-v6.png` : PNG 1414 × 1113, ratio proche de 1032:812 recommandé par Google. Nom versionné pour ne pas remplacer l'ancien asset ni dépendre de son cache.

Généré avec l'outil intégré imagegen, sans image ni donnée patient transmise. Prompt final :

> Use case: stylized-concept. Asset type: production static hero illustration for Doctorek medical identity pass inside Google Wallet, not a screenshot or card mockup. Create a refined premium abstract care-continuity illustration: one elegant continuous folded satin/glass ribbon forming a calm embracing open loop, sculptural and understated, generous negative space, precise soft studio lighting. Palette strictly Doctorek deep medical navy #042651 background with tonal #163C64, restrained blue #3793E0 and icy blue #B6DAF7 highlights. Full bleed navy edges to blend seamlessly with pass background. Near-square landscape 5:4 composition, ideally 1032x812 PNG; central subject comfortably inset with ample top and bottom breathing room. Sophisticated trustworthy editorial quality, subtle depth, clean surfaces. Absolutely no text, letters, logos, patient data, QR codes, numbers, medical readings, shields, badges, crosses, ECG, glitter, gold or neon. Output just the flat artwork asset, no device or UI frame.

## Validation et mise en service

- Test du payload signé avec clé temporaire et service Google simulé : couleur, URL statique, logo conservé, absence de CIN/numéro d'assurance/photo dans le payload.
- Vérification des rapports le 16 septembre : exécution du 15 septembre à 15:18, `GoogleWalletServiceTest` (1 test) et `GoogleWalletClassServiceTest` (2 tests), aucun échec ni erreur. Les appels Google sont simulés.
- Publier l'asset frontend avant le backend consommateur ; vérifier son accès HTTPS public.
- Vérifier le rendu avec un compte de test autorisé : nom long, contraste, logo circulaire, QR lisible et ouverture de la carte.
- Le mécanisme existant versionne les identifiants des objets : réajouter depuis Doctorek crée la version v6 ; les anciens pass ne sont pas automatiquement actualisés et un doublon peut apparaître. Ne retirer l'ancien qu'après vérification du nouveau.
- Aucun ajout de donnée personnelle par cette refonte. La validation juridique/sécurité de l'intégration Wallet et des données déjà transmises reste distincte de la validation graphique.
- Validation visuelle sur téléphone et déploiement : non effectués dans cette intervention.
