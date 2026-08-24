# Design System — Agent IA Doctorek (chat conversationnel)

Statut : proposition de conception, 11 août 2026
Portée : la surface de chat de l'agent IA (recherche de médecins, localisation, informations, disponibilités, prise de rendez-vous).

Ce document étend le design system Doctorek existant (`doctorek-frontend/AGENTS.md`, `app/globals.css`). Il n'introduit **aucune nouvelle famille de couleurs ni police**. Il ajoute une couche de tokens propres à l'agent, construite sur la marque.

---

## 1. Le parti pris

> L'agent n'est pas un chatbot. C'est un **assistant de recherche qui rend des objets manipulables**.

Un chat médical qui répond en paragraphes est inutile : le patient ne veut pas lire « J'ai trouvé le Dr Bennani, cardiologue à Casablanca, disponible mardi ». Il veut voir la carte du médecin, sa position sur le plan, et cliquer sur mardi 14h30.

Trois décisions structurantes en découlent.

### Décision 1 — Le tour de l'agent n'est pas une bulle

| Locuteur | Forme | Raison |
|----------|-------|--------|
| Patient | Bulle bleue `#007DFF`, alignée à droite, `max-w-[75%]` | Identique à la messagerie existante (`MessageBubble.tsx`) : cohérence d'écriture entre les deux surfaces de conversation |
| Agent | **Bloc pleine largeur**, sans bulle, posé sur le canevas | Une bulle à 75 % étrangle les cartes médecin, la carte Leaflet et le rail de créneaux. La pleine largeur est ce qui rend l'agent utile |

C'est le point qui empêche cette interface de ressembler à un wrapper ChatGPT.

### Décision 2 — Le texte de l'agent est un chapeau, pas le contenu

Le texte de l'agent est plafonné : **une à deux phrases**, `text-[15px]`, gris `#465058`. Il annonce ce qui suit, il ne le décrit pas.

```
« 3 cardiologues à Casablanca acceptent de nouveaux patients. »
[ carte médecin ] [ carte médecin ] [ carte médecin ]
```

et non

```
« J'ai trouvé pour vous 3 cardiologues à Casablanca. Le premier est le
  Dr Bennani, situé au 12 rue... »
```

### Décision 3 — L'agent propose, le patient confirme

L'agent ne réserve jamais seul. Chaque intention de réservation se termine par un CTA qui ouvre le `BookingDrawer` existant, avec les champs pré-remplis et **visiblement modifiables**. La confirmation reste dans le flux de réservation éprouvé de l'application. C'est une contrainte de sécurité clinique, exprimée dans le design par un traitement visuel distinct (voir §5, `agent-commit`).

---

## 2. Couleurs

Aucune nouvelle teinte. On dérive des rôles.

| Rôle | Token | Valeur | Usage |
|------|-------|--------|-------|
| Canevas conversation | `--agent-canvas` | `#F1F6FD` + trame (classe `.dk-canvas`) | Fond du fil. Le bleuté rattache l'agent à la marque là où un gris neutre le ferait flotter |
| Surface bloc agent | `--agent-surface` | `#FFFFFF` | Cartes et blocs de réponse |
| Bordure surface | `--agent-border` | `#EAEEF3` | `ring-1`, comme les bulles reçues de la messagerie |
| Bulle patient | `--agent-user-bg` | `#007DFF` | Identique à `MessageBubble` mine |
| Texte agent | `--agent-text` | `#465058` | Le chapeau. Volontairement plus doux que le `#333333` du corps de texte : l'agent parle moins fort que les données |
| Titre dans cartes | `--agent-title` | `#010C2D` | Nom du médecin, en-têtes |
| Trace d'outil | `--agent-trace` | `#8A97A6` | « Recherche dans l'annuaire… » |
| Fond trace | `--agent-trace-bg` | `#EBF5FF` | Bandeau discret pendant l'exécution |
| Créneau libre | `--agent-slot` | `#007DFF` sur `#EBF5FF` | Puces de créneaux |
| Créneau retenu | `--agent-slot-active` | blanc sur `#007DFF` | Sélection |
| Engagement | `--agent-commit` | `#00263C` | CTA « Confirmer ce rendez-vous ». Navy, pas bleu : l'action irréversible ne doit pas ressembler à un lien |
| Succès | `--agent-ok` | `#2EB67D` | RDV confirmé |
| Prudence | `--agent-warn` | `#ECB22E` | Avertissement médical, données incertaines |
| Erreur | `--agent-error` | `#E01E5A` | Échec d'outil, aucun résultat |

**Interdits explicites** — dérives IA génériques bannies sur cette surface :

- pas de dégradé violet→bleu (le seul dégradé toléré est `#EBF4FF → #DFEFFE` déjà utilisé dans les états vides de `ResultsList.tsx`) ;
- pas de glassmorphism ni de `backdrop-blur` sur les cartes ;
- pas d'avatar « ✨ » ni d'icône étincelle sur chaque message ;
- pas d'accent violet pour signifier « IA ». L'agent est Doctorek, il est bleu.

---

## 3. Typographie

Reprise stricte de l'existant : Geist (corps), Plus Jakarta Sans (titres, `letter-spacing: -0.02em`).

| Élément | Taille | Graisse | Couleur |
|---------|--------|---------|---------|
| Chapeau agent | `15px / 1.6` | 400 | `--agent-text` |
| Message patient | `13.5px / 1.6` | 400 | blanc |
| Nom du médecin | `15px` | 700, Jakarta | `--agent-title` |
| Spécialité, ville | `13px` | 500 | `#465058` |
| Créneau | `13px` tabulaire | 600 | selon état |
| Trace d'outil | `12px` | 500 | `--agent-trace` |
| Mention légale | `11.5px` | 400 | `#8A97A6` |

`tabular-nums` obligatoire sur toute heure, date, distance et prix : sans quoi un rail de créneaux tremble au survol.

---

## 4. Rythme et espacement

Échelle 4 px, alignée sur les composants existants.

| Token | Valeur | Usage |
|-------|--------|-------|
| `--agent-gap-turn` | `24px` | Entre deux tours de conversation |
| `--agent-gap-block` | `12px` | Entre le chapeau et ses cartes |
| `--agent-gap-card` | `8px` | Entre deux cartes d'une même réponse |
| `--agent-pad-card` | `14px 16px` | Intérieur de carte |
| `--agent-pad-bubble` | `8px 14px` | Bulle patient (reprend `px-3.5 py-2`) |

Le rythme est **volontairement inégal** : 24 px entre tours contre 8 px entre cartes d'un même tour. C'est ce contraste qui fait lire une réponse comme un groupe, pas comme une liste plate.

Rayons : `--radius` du projet (`0.625rem`). Cartes `rounded-2xl`, puces de créneau `rounded-lg`, bulle patient `rounded-2xl rounded-br-md` (asymétrie conservée depuis la messagerie).

Ombres : une seule, `0 1px 2px rgba(1,12,45,0.06)`, reprise de `MessageBubble`. La profondeur vient de `ring-1 ring-[#EAEEF3]`, pas de l'empilement d'ombres.

---

## 5. Inventaire des composants

Le fil est une séquence de tours. Un tour agent contient un chapeau et zéro ou plusieurs **blocs riches**.

### `AgentTurn` — conteneur
Pleine largeur, pas de fond propre, `gap-3`. Une pastille discrète 20 px avec le logo Doctorek, uniquement sur le **premier** tour d'une réponse (pas de répétition d'avatar).

### `UserBubble`
Réutilise le traitement de `MessageBubble` (`isMine`). Aucun nouveau composant si le style peut être extrait.

### `ToolTrace` — l'agent travaille
Bandeau `--agent-trace-bg`, hauteur 28 px, texte 12 px, avec `LogoLoader` en 60 px.
`Recherche dans l'annuaire…` → `Vérification des disponibilités…` → disparaît à l'arrivée du résultat.
Rend le système lisible : le patient voit *quel* outil tourne, pas un spinner anonyme.

### `MedecinResultCard`
Reprend `MedecinCardList` du module recherche, en variante compacte : avatar initiales HSL, nom, spécialité, ville, distance, note, secteur tarifaire. Actions : `Voir le profil` (lien) et `Disponibilités` (déplie le rail).
**Ne pas redessiner** — la carte de recherche est déjà le langage de l'application.

### `MapPreview`
Leaflet en lecture seule, `h-[180px] rounded-xl`, marqueurs numérotés reliés aux cartes par le même index. Survol d'une carte → marqueur surligné. Clic sur le bloc → ouvre `/recherche` avec les mêmes filtres.
Statique par défaut (pas de zoom accidentel pendant le scroll du fil).

### `SlotRail`
Rail horizontal scrollable de puces de créneaux, groupées par jour avec en-tête collant.
États : libre, retenu, complet (barré, `#8A97A6`, non cliquable).
Cible tactile 44 px minimum.

### `BookingHandoff` — le passage de relais
Bloc de récapitulatif : médecin, date, heure, motif pré-rempli.
CTA principal `--agent-commit` (navy) : **« Vérifier et confirmer »** — le libellé dit que ce n'est pas encore réservé.
Lien secondaire : « Modifier ». Ouvre `BookingDrawer` avec les champs remplis et éditables.

### `AgentDisclaimer`
Une ligne 11,5 px sous la première réponse médicale d'une session :
« Informations issues de l'annuaire Doctorek. Ne remplace pas un avis médical. »
Affichée une fois, pas à chaque tour.

### `Composer`
Champ de saisie ancré en bas, `ring-1 ring-[#EAEEF3]`, ombre montante.
Suggestions de départ en puces au-dessus du champ, uniquement sur le fil vide : « Cardiologue à Casablanca », « Disponibilités cette semaine », « Médecin près de moi ».
Bouton micro à droite, prévu pour l'agent vocal (v2), rendu désactivé et non annoncé si la fonctionnalité est absente.

---

## 6. États

Chaque bloc doit exister dans les cinq états. Un état manquant est un bug de design.

| État | Traitement |
|------|-----------|
| Vide (fil neuf) | Logo + une phrase + 3 puces de suggestion. Pas de héros centré sur dégradé |
| Chargement | `ToolTrace` nommant l'outil. Texte agent en streaming avec curseur, jamais de squelette pour le texte |
| Résultat partiel | Les cartes s'affichent dès leur arrivée ; la carte Leaflet peut suivre |
| Aucun résultat | Reprend l'état vide de `ResultsList.tsx` (illustration + deux actions). Cohérence de langage |
| Erreur d'outil | Bordure `--agent-error`, message précis (« L'agenda du Dr X est indisponible »), bouton « Réessayer ». Jamais « Une erreur est survenue » |

---

## 7. Mouvement

Budget serré. Rien qui se déclenche au scroll.

| Interaction | Animation | Durée |
|-------------|-----------|-------|
| Arrivée d'un tour | `opacity 0→1`, `translateY 6px→0` | 180 ms, `cubic-bezier(0.4,0,0.2,1)` |
| Cartes d'une réponse | Décalage de 40 ms par carte, plafonné à 3 | 160 ms |
| Sélection de créneau | `background` + `scale(0.98)` au `:active` | 120 ms |
| Trace d'outil | `LogoLoader` (masque CSS existant) | boucle 2 s |

`@media (prefers-reduced-motion: reduce)` : décalages et translations supprimés, opacité conservée. Le `LogoLoader` gère déjà ce cas.

---

## 8. Responsive

| Largeur | Disposition |
|---------|-------------|
| < 640 px | Fil pleine largeur. `MapPreview` en `h-[140px]`. `SlotRail` en défilement horizontal avec indice de bord |
| 640–1023 px | Fil `max-w-[680px]` centré |
| ≥ 1024 px | Fil `max-w-[760px]` centré. Option : panneau carte persistant à droite qui suit le dernier résultat géolocalisé |

Le fil ne dépasse jamais 760 px : au-delà, le chapeau devient illisible et les cartes s'étirent.

---

## 9. Accessibilité

- Fil en `role="log"` `aria-live="polite"` ; les tours agent sont annoncés, pas les traces d'outil.
- Contraste : `#465058` sur `#F1F6FD` = 7,1:1 ✅ ; blanc sur `#007DFF` = 4,6:1 ✅ (réservé au ≥ 14 px semi-gras) ; `#8A97A6` sur blanc = 3,1:1 ⚠️ **limité aux mentions non essentielles**.
- Focus visible partout : `focus-visible:ring-2 focus-visible:ring-[#007DFF]`, motif déjà employé dans `ResultsList.tsx`.
- Créneaux navigables au clavier (flèches dans le rail, `Entrée` pour retenir).
- Cibles tactiles ≥ 44 px, y compris sur les puces de créneau.

---

## 10. Ce qui est réutilisé plutôt que reconstruit

| Besoin | Source existante |
|--------|------------------|
| Bulle patient | `features/messaging/components/MessageBubble.tsx` |
| Carte médecin | `features/annuaire/components/MedecinCardList.tsx` |
| Avatar initiales HSL | `features/annuaire/components/MedecinAvatar.tsx` |
| Carte Leaflet | `features/recherche/components/MapPanel.tsx` |
| Créneaux | `features/agenda/components/CreneauxGrid.tsx`, `TimeSlotList.tsx` |
| Confirmation RDV | `features/agenda/components/BookingDrawer.tsx` |
| Chargement | `components/LogoLoader.tsx` |
| Erreur | `components/ErrorState.tsx` |
| États vides | motif de `features/recherche/components/ResultsList.tsx` |

**Composants réellement nouveaux : cinq.** `AgentTurn`, `ToolTrace`, `SlotRail`, `BookingHandoff`, `Composer`. Tout le reste est de l'assemblage.

---

## 11. Fichiers joints

- `design-tokens.json` — tokens exploitables (build, tests de contraste)
- `design-preview.html` — aperçu autonome, sans dépendance, ouvrable dans un navigateur
