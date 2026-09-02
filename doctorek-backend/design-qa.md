# Design QA — Email de confirmation de rendez-vous

## Evidence

- Source visual truth: `C:\Users\Akram\AppData\Local\Temp\codex-clipboard-0bab89c7-880b-416f-a086-75450305c774.png`
- Source pixels: 1023 × 1537 px (mock agenda-first complet).
- Implementation URL: `http://127.0.0.1:4173/email-confirmation-preview.html`
- Implementation desktop screenshot: `C:\Users\Akram\Desktop\doctorek\doctorek-backend\target\design-qa-email-desktop.jpg`
- Implementation mobile screenshot: `C:\Users\Akram\Desktop\doctorek\doctorek-backend\target\design-qa-email-mobile.jpg`
- Confirmation sans durée: `C:\Users\Akram\Desktop\doctorek\doctorek-backend\target\design-qa-email-confirmation.jpg`
- Bienvenue unifiée: `C:\Users\Akram\Desktop\doctorek\doctorek-backend\target\design-qa-email-bienvenue.jpg`
- Code d'accès unifié: `C:\Users\Akram\Desktop\doctorek\doctorek-backend\target\design-qa-email-code-acces.jpg`
- Code d'accès mobile: `C:\Users\Akram\Desktop\doctorek\doctorek-backend\target\design-qa-email-code-acces-mobile.jpg`
- Rappel unifié: `C:\Users\Akram\Desktop\doctorek\doctorek-backend\target\design-qa-email-rappel.jpg`
- Implementation pixels: 1265 × 1114 px (desktop full-page) et 375 × 1196 px (mobile full-page).
- CSS viewports: 900 × 1200 et 390 × 844; capture full-page, densité du webview conservée.
- Normalisation: comparaison sur la largeur logique du conteneur email (600 px) et sur les mêmes données, plutôt que sur un overlay pixel à pixel; la source est un mock haute densité plus long.
- State: confirmation réussie, vendredi 28 août 2026 à 09h00, durée 30 minutes, motif `test`.

## Full-view comparison evidence

La hiérarchie de la source est conservée: marque et état de confirmation, ticket bleu date/heure, titre, métadonnées en lignes, action agenda, action de gestion, puis pied de page marine rassurant. La durée a été retirée du ticket et des métadonnées de confirmation. Le même langage a été appliqué à la bienvenue, aux codes de sécurité et aux rappels. Le rendu mobile conserve cette séquence, ne produit aucun débordement horizontal et la référence longue revient proprement à la ligne.

## Focused-region comparison evidence

- Ticket calendrier: les blocs `VEN / 28 / AOÛT` et `vendredi 28 août 2026 / 09h00 / 30 minutes` restent immédiatement scannables sur desktop et mobile.
- Actions: les deux liens visibles pointent vers Google Calendar et l'espace rendez-vous patient.
- Variantes: bienvenue, code d'accès et rappel partagent le même canevas clair, mot-symbole, hiérarchie typographique, composants de contenu et footer marine.
- Performance email: `document.images.length = 0`; aucun `<img>`, `cid:`, `Content-ID` ou MIME `image/*` n'est présent.
- Console: aucune erreur ni alerte pendant les captures.

## Findings

- Aucun écart P0, P1 ou P2 actionnable.
- [P3 accepté] Le logo raster et les pictogrammes du mock sont remplacés par un mot-symbole HTML et des libellés textuels. C'est une déviation explicite et intentionnelle pour respecter la demande de ne charger ni afficher aucune image/`inline.png`.
- [P3 accepté] Le ticket utilise un bleu uni et des angles simples au lieu du dégradé et des encoches décoratives du mock. Ce choix protège la compatibilité Gmail/Outlook et allège le HTML transactionnel.

## Required fidelity surfaces

- Fonts and typography: corps en pile web-safe, hiérarchie et graisses proches de la source; mot-symbole en Georgia italique comme fallback textuel sans asset.
- Spacing and layout rhythm: largeur email 600 px, padding généreux, ticket dominant, lignes de détails régulières, footer distinct.
- Colors and visual tokens: bleu `#007DFF`, marine `#00263C`, vert succès et surfaces claires conformes aux tokens Doctorek.
- Image quality and asset fidelity: aucune image par contrainte utilisateur; absence vérifiée dans le DOM et le MIME.
- Copy and content: date, heure, durée, motif, référence, aide, confidentialité et mentions automatiques sont présents et exacts.

## Comparison history

- Passe initiale: aucun P0/P1/P2 détecté. Aucun correctif visuel bloquant nécessaire.
- Validation responsive: capture supplémentaire à 390 × 844; aucun overflow, aucune perte d'action ou de contenu.
- Extension du système: bienvenue, code d'accès et rappel capturés après unification; aucun P0/P1/P2 détecté.

## Implementation checklist

- [x] Hiérarchie agenda-first fidèle.
- [x] Données réelles du rendez-vous injectées et échappées.
- [x] Liens calendrier et gestion actifs.
- [x] Durée absente de la confirmation HTML et texte.
- [x] Bienvenue, vérification, code d'accès, rappels et notifications unifiés via le shell partagé.
- [x] Aucun asset inline ou distant.
- [x] Desktop et mobile vérifiés.
- [x] Tests backend ciblés passants.

## Follow-up polish

- Tester le rendu sur Outlook desktop lors d'une prochaine campagne de QA multi-client.

final result: passed
