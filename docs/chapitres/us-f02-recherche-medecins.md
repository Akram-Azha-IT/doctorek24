# US-F02 — Recherche Médecins (Frontend)

**Module** : `frontend / annuaire`  
**Route** : `/recherche`  
**Stack** : Next.js 16 · React 19 · TypeScript · TanStack Query v5 · Tailwind CSS v4  
**Appels API** : `GET /api/v1/annuaire/medecins?specialite=X&ville=Y`  
**Statut** : Livré — Sprint 2 Frontend MVP

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture en couches (Frontend)](#2-architecture-en-couches-frontend)
3. [Design patterns utilisés](#3-design-patterns-utilisés)
4. [Contrat d'API consommé](#4-contrat-dapi-consommé)
5. [Validation & UX](#5-validation--ux)
6. [Stratégie de test](#6-stratégie-de-test)
7. [Justifications techniques](#7-justifications-techniques)
8. [Preuves d'exécution](#8-preuves-dexécution)

---

## 1. Vue d'ensemble

La page `/recherche` est la fonctionnalité centrale du MVP. Elle permet à un utilisateur non authentifié de **rechercher des médecins** par spécialité et/ou ville.

Comportement :
- Deux champs texte libres : **spécialité** et **ville**
- La recherche se déclenche **automatiquement** après 400 ms d'inactivité (debounce)
- Les résultats s'affichent en **grille responsive** (1 → 2 → 3 colonnes)
- Sans paramètre : tous les médecins actifs sont retournés
- Chaque carte médecin est un lien vers `/medecins/[id]`
- États gérés : chargement, erreur, liste vide, résultats

Flux complet :

```
Utilisateur tape "Cardio" dans spécialité
        ↓
  useDebounce (400ms)
        ↓
  TanStack Query → GET /api/v1/annuaire/medecins?specialite=Cardio
        ↓
  apiFetch → ApiResponse<MedecinProfile[]>
        ↓
  Grille de MedecinCard
```

---

## 2. Architecture en couches (Frontend)

```
app/
└── recherche/
    └── page.tsx                      ← Client Component — état + rendu conditionnel

features/
└── annuaire/
    ├── hooks.ts                      ← useSearchMedecins (TanStack Query + debounce)
    ├── api.ts                        ← searchMedecins() → apiFetch
    ├── types.ts                      ← interface MedecinProfile
    └── components/
        ├── SearchForm.tsx            ← inputs spécialité + ville
        └── MedecinCard.tsx           ← carte résultat (lien vers profil)

lib/
└── api-client.ts                     ← apiFetch<T> — wrapper HTTP centralisé

hooks/
└── useDebounce.ts                    ← hook générique debounce
```

### Flux de données

```
RecherchePage
    │
    ├── SearchForm ──────────────────→ onChange → setFormValues
    │
    └── useSearchMedecins(specialite, ville)
              │
              ├── useDebounce(specialite, 400ms)
              ├── useDebounce(ville, 400ms)
              │
              └── useQuery(['medecins','search', dSpecialite, dVille])
                        │
                        └── searchMedecins(dSpecialite, dVille)
                                  │
                                  └── apiFetch('/api/v1/annuaire/medecins?...')
                                            │
                                            └── MedecinProfile[]
```

---

## 3. Design patterns utilisés

### Custom Hook (`useSearchMedecins`)

Encapsule toute la logique de recherche (debounce + query) dans un hook réutilisable. La page ne connaît ni TanStack Query ni `useDebounce` directement.

```typescript
// features/annuaire/hooks.ts
export function useSearchMedecins(specialite: string, ville: string) {
  const debouncedSpecialite = useDebounce(specialite.trim(), 400)
  const debouncedVille      = useDebounce(ville.trim(), 400)

  return useQuery({
    queryKey: ['medecins', 'search', debouncedSpecialite, debouncedVille],
    queryFn:  () => searchMedecins(debouncedSpecialite, debouncedVille),
    staleTime: 60 * 1000,
  })
}
```

### Debounce Hook générique

```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

Délai de 400 ms — suffisant pour éviter les requêtes parasites sans dégrader la réactivité perçue.

### Query Key structuré (TanStack Query)

```typescript
queryKey: ['medecins', 'search', debouncedSpecialite, debouncedVille]
```

Structure hiérarchique permettant :
- Invalidation ciblée (`['medecins', 'search']` invalide toutes les recherches)
- Déduplication automatique de requêtes identiques
- Cache partagé entre composants

### apiFetch wrapper

```typescript
// lib/api-client.ts
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res  = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body: ApiResponse<T> = await res.json()
  if (!body.success || !res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body.data as T
}
```

Un seul point de communication avec le backend. Gestion unifiée de l'enveloppe `ApiResponse<T>`.

### Rendu conditionnel (états multiples)

```typescript
// app/recherche/page.tsx
if (isLoading) return <Spinner />
if (isError)   return <ErrorMessage message={error.message} />
if (!data || data.length === 0) return <EmptyState />

return (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {data.map(m => <MedecinCard key={m.id} medecin={m} />)}
  </div>
)
```

---

## 4. Contrat d'API consommé

### `GET /api/v1/annuaire/medecins`

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `specialite` | `string` | Non | Filtre partiel sur la spécialité |
| `ville` | `string` | Non | Filtre partiel sur la ville |

**Réponse 200 OK :**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "Ahmed",
      "lastName": "Benali",
      "specialite": "Cardiologie",
      "ville": "Alger",
      "adresse": "Rue Didouche Mourad",
      "inpe": "1234567890"
    }
  ],
  "message": null
}
```

---

## 5. Validation & UX

| Situation | Comportement |
|-----------|-------------|
| Champs vides | Retourne tous les médecins actifs |
| Frappe rapide | Debounce 400 ms — une seule requête émise |
| Chargement | Indicateur visuel (spinner ou skeleton) |
| Erreur réseau | Message d'erreur affiché |
| Aucun résultat | Message "Aucun médecin trouvé" |
| Cache hit | Résultats affichés instantanément (staleTime 60s) |

---

## 6. Stratégie de test

| Type | Scénario | Outil |
|------|----------|-------|
| Unit | `useDebounce` retarde bien la valeur | Vitest |
| Unit | `searchMedecins` construit la bonne URL | Vitest + MSW |
| Integration | `useSearchMedecins` déclenche la query après debounce | React Testing Library |
| E2E | Saisir "Cardio" → voir des résultats | Playwright |
| E2E | Saisir une spécialité inexistante → état vide | Playwright |
| E2E | Cliquer sur une carte → navigation vers `/medecins/[id]` | Playwright |

---

## 7. Justifications techniques

| Choix | Justification |
|-------|---------------|
| TanStack Query | Cache automatique, déduplication, états `isLoading/isError` out-of-the-box |
| Debounce 400 ms | Réduit les requêtes inutiles sans impact perçu sur la réactivité |
| `staleTime: 60s` | Les résultats de recherche ne changent pas à chaque milliseconde |
| Grille CSS responsive | `sm:grid-cols-2 lg:grid-cols-3` — aucune dépendance JS pour le layout |
| `queryKey` hiérarchique | Invalidation fine et déduplication par TanStack Query |
| Recherche backend (pg_trgm) | Le matching flou est côté serveur, le frontend reste stateless |

---

## 8. Preuves d'exécution

```bash
# Lancer le frontend
cd doctorek-frontend && npm run dev

# Tester l'API directement
curl "http://localhost:8080/api/v1/annuaire/medecins?specialite=Cardio&ville=Alger"
```

**Screenshots** :
- `docs/screenshots/f02-recherche-vide.png` — état initial / liste complète
- `docs/screenshots/f02-recherche-cardiologie.png` — filtre spécialité
- `docs/screenshots/f02-recherche-vide-resultat.png` — aucun résultat
