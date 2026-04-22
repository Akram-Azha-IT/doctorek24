# US-F13 — Recherche par disponibilité

## Description

> En tant que **patient**, je veux filtrer la liste des médecins par leur disponibilité réelle (aujourd'hui ou cette semaine), afin de ne voir que ceux qui peuvent me recevoir rapidement.

> En tant que **patient**, je veux voir une pastille « Disponible aujourd'hui » sur les cartes médecin pertinentes, même quand je n'ai pas activé de filtre, afin d'identifier rapidement une consultation possible le jour même.

## Critères d'acceptation

- La page `/recherche` propose un sélecteur en pilule à 3 valeurs :
  - **Toutes dates** (par défaut) — comportement existant
  - **Aujourd'hui** — ne garde que les médecins ayant ≥ 1 créneau libre aujourd'hui
  - **Cette semaine** — ne garde que les médecins ayant ≥ 1 créneau libre dans les 7 prochains jours
- La pastille verte **« Disponible aujourd'hui »** est calculée et affichée pour les cartes éligibles **quel que soit le filtre actif**.
- Les inputs (spécialité + ville) restent **debounced à 400 ms**.
- Un **skeleton à 6 cartes** (`h-24 animate-pulse`) s'affiche pendant le chargement.
- Un message d'**état vide adapté au filtre** est affiché si aucun résultat (« Aucun médecin disponible aujourd'hui », etc.).
- Les erreurs réseau par date n'invalident pas l'ensemble du résultat (tolérance per-date).

## Type & helpers — `lib/disponibilite.ts`

```typescript
export type DisponibiliteFilter = 'all' | 'today' | 'week';

export function formatDateISO(date: Date): string;   // YYYY-MM-DD (timezone locale)
export function todayISO(): string;
export function nextNDaysISO(days: number): string[]; // [today, today+1, ..., today+days-1]
```

> Toutes les dates sont calculées en **timezone locale** (pas de `new Date("YYYY-MM-DD")` qui décale en UTC).

## API — `features/annuaire/api.ts`

```typescript
async function hasAvailability(medecinId: string, dates: string[]): Promise<boolean> {
  for (const date of dates) {
    try {
      const creneaux = await getCreneaux(medecinId, date);
      if (creneaux.some(c => c.disponible)) return true;
    } catch {
      // tolérance per-date : on ignore et on continue
    }
  }
  return false;
}

export async function searchMedecinsDisponibles(
  specialite: string,
  ville: string,
  filter: DisponibiliteFilter,
): Promise<{ medecins: MedecinProfile[]; availableTodayIds: Set<string> }> {
  const all = await getMedecins(specialite, ville);

  // 1) Toujours calculer la disponibilité du jour pour la pastille
  const todayChecks = await Promise.all(
    all.map(m => hasAvailability(m.id, [todayISO()]).then(ok => [m.id, ok] as const)),
  );
  const availableTodayIds = new Set(
    todayChecks.filter(([, ok]) => ok).map(([id]) => id),
  );

  if (filter === 'all') return { medecins: all, availableTodayIds };
  if (filter === 'today') {
    return { medecins: all.filter(m => availableTodayIds.has(m.id)), availableTodayIds };
  }

  // filter === 'week' : court-circuit si déjà dispo aujourd'hui
  const weekDates = nextNDaysISO(7);
  const weekChecks = await Promise.all(
    all.map(m =>
      availableTodayIds.has(m.id)
        ? Promise.resolve(true)
        : hasAvailability(m.id, weekDates),
    ),
  );
  const filtered = all.filter((_, i) => weekChecks[i]);
  return { medecins: filtered, availableTodayIds };
}
```

### Choix techniques clés

| Choix                                | Raison                                                                |
|--------------------------------------|-----------------------------------------------------------------------|
| `Promise.all` sur les médecins       | Parallélisation de la fan-out (latence dominée par le médecin le plus lent) |
| Boucle séquentielle sur les dates    | Court-circuit dès qu'un créneau libre est trouvé                      |
| Court-circuit week-mode si today OK  | Évite 7 appels HTTP inutiles par médecin déjà disponible              |
| `try/catch` per-date                 | Une erreur 4xx/5xx sur un jour ne masque pas la disponibilité globale |
| Toujours calculer `availableTodayIds`| Permet d'afficher la pastille même en mode `all`                      |

## Hook — `features/annuaire/hooks.ts`

```typescript
export function useSearchMedecinsDisponibles(
  specialite: string,
  ville: string,
  filter: DisponibiliteFilter,
) {
  const debouncedSpec = useDebounce(specialite, 400);
  const debouncedVille = useDebounce(ville, 400);

  return useQuery({
    queryKey: ['medecins', 'search', 'dispo', debouncedSpec, debouncedVille, filter],
    queryFn: () => searchMedecinsDisponibles(debouncedSpec, debouncedVille, filter),
    staleTime: 60_000,
  });
}
```

## Composants React impliqués

| Composant                                                       | Rôle                                                                  |
|-----------------------------------------------------------------|-----------------------------------------------------------------------|
| `app/recherche/page.tsx`                                        | Toggle de filtre, skeleton, état vide adapté, rendu de la liste       |
| `features/annuaire/components/MedecinCard.tsx`                  | Prop `availableToday?: boolean` + pastille emerald                    |
| `features/annuaire/api.ts` → `searchMedecinsDisponibles`        | Logique de filtrage et calcul des disponibilités                      |
| `features/annuaire/hooks.ts` → `useSearchMedecinsDisponibles`   | TanStack Query + debounce + cache                                     |
| `lib/disponibilite.ts`                                          | Type `DisponibiliteFilter` + helpers de date timezone-locale          |

## Pastille « Disponible aujourd'hui »

```tsx
{availableToday && (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    Disponible aujourd'hui
  </span>
)}
```

## Tests manuels de validation

1. **Filtre par défaut (`all`) :**
   - Charger `/recherche` → tous les médecins listés, pastille verte uniquement sur ceux avec un créneau libre aujourd'hui.
2. **Filtre « Aujourd'hui » :**
   - Activer le filtre → la liste se réduit aux médecins ayant un créneau libre aujourd'hui ; tous portent la pastille.
3. **Filtre « Cette semaine » :**
   - Activer le filtre → la liste inclut les médecins disponibles dans les 7 prochains jours.
   - Vérifier qu'un médecin disponible aujourd'hui apparaît bien (court-circuit OK).
4. **Debounce :**
   - Taper rapidement dans « spécialité » → un seul appel réseau après 400 ms.
5. **Skeleton :**
   - Throttler le réseau dans DevTools → vérifier les 6 squelettes pendant le chargement.
6. **État vide :**
   - Filtrer par spécialité inexistante + filtre « Aujourd'hui » → message « Aucun médecin disponible aujourd'hui ».
7. **Tolérance aux erreurs :**
   - Simuler une 500 sur un jour donné (ex. via DevTools) → la disponibilité reste calculée à partir des autres jours.
8. **Cache TanStack :**
   - Naviguer puis revenir sur `/recherche` dans les 60 s → pas de nouvel appel.

## Capture d'écran

`docs/captures/us-f13-toggle-filter.png`
`docs/captures/us-f13-pastille-disponible.png`
`docs/captures/us-f13-empty-state.png`
