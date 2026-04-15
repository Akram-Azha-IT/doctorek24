# US-F04 — Profil Public Médecin (Frontend)

**Module** : `frontend / annuaire`  
**Route** : `/medecins/[id]`  
**Stack** : Next.js 16 · React 19 · TypeScript · TanStack Query v5 · Tailwind CSS v4  
**Appel API** : `GET /api/v1/annuaire/medecins/{id}`  
**Statut** : Livré — Sprint 2 Frontend MVP

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture en couches (Frontend)](#2-architecture-en-couches-frontend)
3. [Design patterns utilisés](#3-design-patterns-utilisés)
4. [Contrat d'API consommé](#4-contrat-dapi-consommé)
5. [Stratégie de test](#5-stratégie-de-test)
6. [Justifications techniques](#6-justifications-techniques)
7. [Preuves d'exécution](#7-preuves-dexécution)

---

## 1. Vue d'ensemble

La page `/medecins/[id]` affiche le **profil public** d'un médecin. Elle est accessible depuis la grille de résultats de `/recherche` et ne nécessite aucune authentification.

L'identifiant du médecin est extrait de l'URL dynamique (segment `[id]`), utilisé pour appeler le backend, puis le profil complet est affiché.

Flux :

```
Utilisateur clique sur une carte médecin dans /recherche
        ↓
Navigation vers /medecins/{uuid}
        ↓
useParams → id = '{uuid}'
        ↓
useMedecin(id) → TanStack Query
        ↓
GET /api/v1/annuaire/medecins/{uuid}
        ↓
ApiResponse<MedecinProfile>
        ↓
Affichage MedecinProfileCard
        ↓
Lien "← Retour à la recherche" → /recherche
```

États gérés : chargement, erreur (médecin introuvable / erreur réseau), succès.

---

## 2. Architecture en couches (Frontend)

```
app/
└── medecins/
    └── [id]/
        └── page.tsx                      ← Client Component — useParams + rendu conditionnel

features/
└── annuaire/
    ├── hooks.ts                          ← useMedecin(id) — TanStack Query
    ├── api.ts                            ← getMedecin(id) → apiFetch
    ├── types.ts                          ← interface MedecinProfile
    └── components/
        └── MedecinProfileCard.tsx        ← carte profil complète

lib/
└── api-client.ts                         ← apiFetch<T>
```

### Flux de données

```
MedecinPage
    │
    ├── useParams<{ id: string }>()  →  id
    │
    └── useMedecin(id)
              │
              └── useQuery({
                    queryKey: ['medecins', id],
                    queryFn:  () => getMedecin(id),
                    enabled:  !!id
                  })
                        │
                        └── getMedecin(id)
                                  │
                                  └── apiFetch<MedecinProfile>(
                                        '/api/v1/annuaire/medecins/{id}'
                                      )
```

---

## 3. Design patterns utilisés

### Route dynamique Next.js (App Router)

Le fichier `app/medecins/[id]/page.tsx` utilise le segment dynamique `[id]`. L'identifiant est récupéré via `useParams` (Client Component) :

```typescript
// app/medecins/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useMedecin } from '@/features/annuaire/hooks'
import { MedecinProfileCard } from '@/features/annuaire/components/MedecinProfileCard'
import Link from 'next/link'

export default function MedecinPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, error } = useMedecin(id)

  if (isLoading) return <div>Chargement...</div>
  if (isError)   return <div>Erreur : {error.message}</div>
  if (!data)     return null

  return (
    <main>
      <Link href="/recherche">← Retour à la recherche</Link>
      <MedecinProfileCard medecin={data} />
    </main>
  )
}
```

### Custom Hook (`useMedecin`)

```typescript
// features/annuaire/hooks.ts
export function useMedecin(id: string) {
  return useQuery({
    queryKey: ['medecins', id],
    queryFn:  () => getMedecin(id),
    enabled:  !!id,
  })
}
```

Le flag `enabled: !!id` empêche l'exécution de la query si l'id est vide ou undefined — protection contre les rendus intermédiaires.

### Query Key partagé avec la liste

```typescript
queryKey: ['medecins', id]
```

Ce queryKey est cohérent avec la hiérarchie utilisée dans `useSearchMedecins` (`['medecins', 'search', ...]`). TanStack Query peut ainsi partager et invalider le cache de façon ciblée (ex : après une mise à jour de profil médecin).

### Separation of concerns : Page vs Card

- **`MedecinPage`** : responsable du fetch, des états, de la navigation
- **`MedecinProfileCard`** : responsable uniquement de l'affichage — reçoit un `MedecinProfile` en prop

```typescript
// features/annuaire/components/MedecinProfileCard.tsx
interface Props {
  medecin: MedecinProfile
}

export function MedecinProfileCard({ medecin }: Props) {
  return (
    <div className="card">
      <h1>{medecin.firstName} {medecin.lastName}</h1>
      <p>{medecin.specialite}</p>
      <p>{medecin.ville}</p>
      <p>{medecin.adresse}</p>
    </div>
  )
}
```

---

## 4. Contrat d'API consommé

### `GET /api/v1/annuaire/medecins/{id}`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID (path) | Identifiant unique du médecin |

**Réponse 200 OK :**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Karim",
    "lastName": "Benali",
    "specialite": "Cardiologie",
    "ville": "Alger",
    "adresse": "10 Rue Didouche Mourad",
    "inpe": "1234567890"
  },
  "message": null
}
```

**Réponse 404 Not Found :**

```json
{
  "success": false,
  "data": null,
  "message": "Médecin introuvable : 550e8400-..."
}
```

L'`apiFetch` transforme automatiquement la réponse 404 en exception JavaScript (`throw new Error(body.message)`), capturée par le flag `isError` de TanStack Query.

---

## 5. Stratégie de test

| Type | Scénario | Outil |
|------|----------|-------|
| Unit | `getMedecin` appelle la bonne URL | Vitest + MSW |
| Unit | `useMedecin` n'émet pas de requête si `id` est vide | Vitest + React Testing Library |
| Integration | Profil médecin s'affiche correctement avec données mockées | React Testing Library + MSW |
| Integration | État d'erreur affiché si API retourne 404 | React Testing Library + MSW |
| E2E | Naviguer depuis /recherche → /medecins/[id] → voir le profil | Playwright |
| E2E | Cliquer "Retour à la recherche" → revenir sur /recherche | Playwright |

---

## 6. Justifications techniques

| Choix | Justification |
|-------|---------------|
| Client Component avec `useParams` | `useParams` nécessite un contexte client ; Next.js App Router ne supporte pas `useParams` dans les Server Components |
| `enabled: !!id` | Évite une requête avec un id vide lors du premier rendu |
| `queryKey: ['medecins', id]` | Cohérence avec la hiérarchie de cache — partage possible avec la liste |
| `MedecinProfileCard` séparé | Testable indépendamment, réutilisable (ex : dans une page admin) |
| Lien "Retour" statique vers `/recherche` | Simple et prévisible — pas de `router.back()` qui dépend de l'historique du navigateur |
| TanStack Query pour le fetch | Cohérence avec `useSearchMedecins` ; cache du profil conservé si l'utilisateur navigue aller-retour |

---

## 7. Preuves d'exécution

```bash
# Récupérer un profil par UUID
curl http://localhost:8080/api/v1/annuaire/medecins/550e8400-e29b-41d4-a716-446655440000
# {"success":true,"data":{"id":"550e8400-...","firstName":"Karim","lastName":"Benali","specialite":"Cardiologie","ville":"Alger","adresse":"10 Rue Didouche Mourad","inpe":"1234567890"},"message":null}

# UUID inexistant → 404
curl http://localhost:8080/api/v1/annuaire/medecins/00000000-0000-0000-0000-000000000000
# {"success":false,"data":null,"message":"Médecin introuvable : 00000000-..."}
```

**Screenshots** :
- `docs/screenshots/f04-profil-medecin.png` — affichage complet du profil
- `docs/screenshots/f04-profil-chargement.png` — état de chargement
- `docs/screenshots/f04-profil-404.png` — message d'erreur pour médecin introuvable
