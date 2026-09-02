# États de résilience Doctorek

## Objectif

Le composant `ResilientState` garantit qu'une liste vide, une information manquante ou une panne temporaire ne produit jamais un écran cassé, silencieux ou technique. Il conserve le contexte, explique la situation en français et propose une action sûre lorsque la récupération est possible.

## Variantes

| Variante | Utilisation | Annonce accessible | Illustration |
|---|---|---|---|
| `empty` | Collection valide sans élément | `status`, polie | Recherche sans résultat |
| `missing` | Page, sélection ou information absente | `status`, polie | Recherche sans résultat |
| `partial` | Une partie des données reste utilisable | `status`, polie | Recherche sans résultat |
| `error` | Erreur applicative ou serveur | `alert`, immédiate | Service en récupération |
| `offline` | Réseau ou backend injoignable | `alert`, immédiate | Service en récupération |

## Règles de contenu

1. Le titre décrit l'état, pas la technologie : « Aucun patient trouvé », jamais « HTTP 404 ».
2. La description explique ce qui reste possible et évite de culpabiliser l'utilisateur.
3. Une action principale corrige la cause ou relance la requête.
4. Une action secondaire offre une sortie sûre sans créer d'impasse.
5. Les erreurs techniques sont traduites par `describeError()` avant affichage.

## Tolérance aux pannes

- TanStack Query réessaie au maximum deux fois les pannes réseau, `408`, `429` et `5xx` avec délai exponentiel plafonné à cinq secondes.
- Chaque tentative HTTP est interrompue après dix secondes par défaut afin qu'une requête bloquée devienne une erreur récupérable au lieu d'un chargement infini. Les traitements longs peuvent fournir un `timeoutMs` explicite.
- Les erreurs `4xx` métier, d'authentification ou de validation ne sont pas répétées automatiquement.
- Les mutations ne sont jamais rejouées automatiquement afin d'éviter les doublons médicaux ou administratifs.
- `app/error.tsx` intercepte les erreurs de rendu et fournit une action `reset()`.
- `app/not-found.tsx` garde une navigation utile lorsqu'une route est absente.
- Les écrans migrés conservent une action de nouvelle tentative explicite et l'état de chargement de cette tentative.

## Exemple

```tsx
<ResilientState
  variant="empty"
  title="Aucun patient trouvé"
  description="Les patients apparaîtront ici après leur premier rendez-vous."
/>

<ErrorState
  error={error}
  onRetry={() => refetch()}
  isRetrying={isFetching}
/>

<MissingValue value={medecin.ville} fallback="Ville non renseignée" />
```

## Accessibilité

- Les illustrations sont décoratives (`alt=""`, `aria-hidden`).
- Les erreurs utilisent `role="alert"`; les états non critiques utilisent `role="status"`.
- Les actions ont une hauteur minimale de 44 px et un focus visible.
- Le texte reste compréhensible sans l'illustration ni la couleur.

## À faire / à éviter

| À faire | À éviter |
|---|---|
| Préserver les données déjà chargées quand une requête secondaire échoue | Vider tout l'écran pour une donnée facultative manquante |
| Afficher « Non renseigné » pour une valeur absente | Afficher un tiret nu ou `undefined` |
| Fournir une action de récupération locale | Forcer un rechargement complet de l'application |
| Utiliser les illustrations officielles du composant | Ajouter un emoji, un SVG improvisé ou une illustration différente par page |
