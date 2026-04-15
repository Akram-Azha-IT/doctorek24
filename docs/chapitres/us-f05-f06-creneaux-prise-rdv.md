# US-F05 & US-F06 — Créneaux disponibles & Prise de rendez-vous (Frontend)

**Module** : `frontend / agenda`  
**Route** : `/medecins/[id]/rdv`  
**Stack** : Next.js 16 · React 19 · TypeScript · TanStack Query v5 · React Hook Form · Zod · Tailwind CSS v4  
**Appels API** :
- `GET /api/v1/agenda/medecins/{id}/creneaux?date={date}` — US-F05
- `POST /api/v1/agenda/rdv` — US-F06  

**Statut** : Livré — Sprint 4 Frontend

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

La page `/medecins/[id]/rdv` implémente deux user stories complémentaires sur une même route :

- **US-F05** — Afficher les créneaux disponibles d'un médecin pour une date donnée
- **US-F06** — Permettre à un patient de réserver un créneau et de recevoir une confirmation

La page fonctionne comme une **machine d'état** à quatre étapes séquentielles :

```
[1] Sélection de date
        ↓
[2] Grille de créneaux disponibles (US-F05)
        ↓  sélection d'un créneau
[3] Formulaire de confirmation (US-F06)
        ↓  soumission réussie
[4] Carte de confirmation (succès)
```

Flux détaillé :

```
Patient accède à /medecins/{uuid}/rdv
        ↓
Sélection d'une date (min = J+1)
        ↓
useCreneaux(id, date) → TanStack Query
        ↓
GET /api/v1/agenda/medecins/{uuid}/creneaux?date={YYYY-MM-DD}
        ↓
ApiResponse<Creneau[]>  (filtre : disponible === true)
        ↓
CreneauxGrid — sélection d'un créneau
        ↓
ConfirmRdvForm (patientId UUID + motif optionnel)
        ↓
usePrendreRdv → POST /api/v1/agenda/rdv
        ↓
RdvSuccessCard — confirmation avec id du rendez-vous
```

---

## 2. Architecture en couches (Frontend)

```
app/
└── medecins/
    └── [id]/
        └── rdv/
            └── page.tsx                      ← Client Component — machine d'état 4 étapes

features/
└── agenda/
    ├── hooks.ts                              ← useCreneaux / usePrendreRdv
    ├── api.ts                                ← getCreneaux / prendreRdv
    ├── schemas.ts                            ← PrendreRdvSchema (Zod)
    └── components/
        ├── CreneauxGrid.tsx                  ← grille de sélection de créneaux
        ├── ConfirmRdvForm.tsx                ← formulaire de confirmation
        └── RdvSuccessCard.tsx                ← carte de succès après réservation

lib/
└── api-client.ts                             ← apiFetch<T>
```

### Flux de données

```
RdvPage
    │
    ├── useParams<{ id: string }>()  →  medecinId
    │
    ├── useState: date, selected (Creneau|null), showForm, confirmedRdv
    │
    ├── useCreneaux(medecinId, date)                   ← US-F05
    │       └── useQuery({
    │             queryKey: ['creneaux', medecinId, date],
    │             queryFn:  () => getCreneaux(medecinId, date),
    │             staleTime: 30_000,
    │             enabled:  !!(medecinId && date)
    │           })
    │
    └── usePrendreRdv(medecinId, date)                 ← US-F06
            └── useMutation({
                  mutationFn: prendreRdv,
                  onSuccess:  () => invalidateQueries(['creneaux', medecinId, date])
                })
```

---

## 3. Design patterns utilisés

### Machine d'état dans le composant page

L'état de la page est géré par quatre variables booléennes / objets :

```typescript
// app/medecins/[id]/rdv/page.tsx
'use client'

const [date, setDate] = useState<string>('')
const [selected, setSelected] = useState<Creneau | null>(null)
const [showForm, setShowForm] = useState(false)
const [confirmedRdv, setConfirmedRdv] = useState<RdvConfirme | null>(null)
```

Le rendu conditionnel garantit une progression linéaire :

```typescript
// Étape 4 : succès
if (confirmedRdv) return <RdvSuccessCard rdv={confirmedRdv} ... />

// Étape 3 : formulaire
if (showForm && selected) return (
  <ConfirmRdvForm
    medecinId={id}
    medecinName={medecinName}
    dateRdv={date}
    heureRdv={selected.heureDebut}
    heureFin={selected.heureFin}
    onSuccess={(rdv) => { setConfirmedRdv(rdv); setShowForm(false) }}
    onCancel={() => setShowForm(false)}
  />
)

// Étape 2 : grille créneaux (avec sélecteur de date)
return (
  <div>
    <input type="date" min={tomorrowISO()} value={date} onChange={...} />
    <CreneauxGrid creneaux={creneaux} selected={selected} onSelect={setSelected} />
    {selected && (
      <button onClick={() => setShowForm(true)}>Confirmer ce créneau</button>
    )}
  </div>
)
```

### Filtre côté client : `disponible === true`

```typescript
// features/agenda/components/CreneauxGrid.tsx
const disponibles = creneaux.filter(c => c.disponible)

if (disponibles.length === 0) {
  return <p>Aucun créneau disponible pour cette date.</p>
}
```

Le backend peut retourner des créneaux avec `disponible: false` (déjà réservés). Le filtre côté client évite de les afficher sans requête supplémentaire.

### Custom Hook avec `staleTime`

```typescript
// features/agenda/hooks.ts
export function useCreneaux(medecinId: string, date: string) {
  return useQuery({
    queryKey: ['creneaux', medecinId, date],
    queryFn:  () => getCreneaux(medecinId, date),
    staleTime: 30_000,          // évite les re-fetch lors de la navigation
    enabled:  !!(medecinId && date),
  })
}
```

Le `staleTime: 30_000` (30 s) prévient les re-fetch intempestifs quand l'utilisateur change d'étape tout en restant sur la même date.

### Invalidation ciblée après réservation

```typescript
// features/agenda/hooks.ts
export function usePrendreRdv(medecinId: string, date: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: prendreRdv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creneaux', medecinId, date] })
    },
  })
}
```

Après une réservation réussie, le cache des créneaux pour ce médecin et cette date est invalidé — si l'utilisateur revient sur la grille, il verra la disponibilité mise à jour.

### Validation Zod avec `superRefine`

```typescript
// features/agenda/schemas.ts
export const PrendreRdvSchema = z.object({
  patientId: z.string().uuid('Identifiant patient invalide (UUID requis)'),
  motif:     z.string().optional(),
})
```

Le `patientId` est un UUID obligatoire, ce qui évite les appels au backend avec des identifiants malformés.

### Formulaire contrôlé (React Hook Form)

```typescript
// features/agenda/components/ConfirmRdvForm.tsx
const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(PrendreRdvSchema),
})

async function onSubmit(values: FormValues) {
  mutate({
    medecinId,
    patientId: values.patientId,
    dateRdv,
    heureRdv,
    motif: values.motif,
  })
}
```

### `tomorrowISO()` — protection contre les dates passées

```typescript
function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
```

Le champ `<input type="date" min={tomorrowISO()} />` empêche de sélectionner la date du jour ou une date passée.

---

## 4. Contrat d'API consommé

### US-F05 — `GET /api/v1/agenda/medecins/{id}/creneaux`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID (path) | Identifiant du médecin |
| `date` | string (query) | Date au format `YYYY-MM-DD` |

**Réponse 200 OK :**

```json
{
  "success": true,
  "data": [
    {
      "id": "c1d2e3f4-...",
      "heureDebut": "09:00",
      "heureFin": "09:30",
      "disponible": true
    },
    {
      "id": "c2d3e4f5-...",
      "heureDebut": "09:30",
      "heureFin": "10:00",
      "disponible": false
    }
  ],
  "message": null
}
```

Les créneaux avec `disponible: false` sont filtrés côté client avant affichage.

---

### US-F06 — `POST /api/v1/agenda/rdv`

**Corps de la requête :**

```json
{
  "medecinId": "550e8400-e29b-41d4-a716-446655440000",
  "patientId":  "660f9511-f30c-52e5-b827-557766551111",
  "dateRdv":    "2026-04-20",
  "heureRdv":   "09:00",
  "motif":      "Consultation de contrôle"
}
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `medecinId` | UUID | Oui | Identifiant du médecin |
| `patientId` | UUID | Oui | Identifiant du patient |
| `dateRdv` | string | Oui | Date du RDV (`YYYY-MM-DD`) |
| `heureRdv` | string | Oui | Heure de début (`HH:mm`) |
| `motif` | string | Non | Motif de consultation |

**Réponse 201 Created :**

```json
{
  "success": true,
  "data": {
    "id": "rdv-uuid-...",
    "medecinId": "550e8400-...",
    "patientId":  "660f9511-...",
    "dateRdv":    "2026-04-20",
    "heureRdv":   "09:00",
    "heureFin":   "09:30",
    "motif":      "Consultation de contrôle",
    "statut":     "CONFIRME"
  },
  "message": null
}
```

**Réponse 409 Conflict (créneau déjà réservé) :**

```json
{
  "success": false,
  "data": null,
  "message": "Ce créneau n'est plus disponible"
}
```

---

## 5. Stratégie de test

| Type | Scénario | Outil |
|------|----------|-------|
| Unit | `getCreneaux` appelle la bonne URL avec la date en query param | Vitest + MSW |
| Unit | `prendreRdv` envoie le body JSON attendu | Vitest + MSW |
| Unit | `useCreneaux` n'émet pas de requête si date vide | Vitest + React Testing Library |
| Unit | `CreneauxGrid` filtre et n'affiche que les créneaux `disponible: true` | Vitest + RTL |
| Unit | `ConfirmRdvForm` bloque la soumission si patientId n'est pas un UUID | Vitest + RTL |
| Unit | `tomorrowISO()` retourne bien J+1 | Vitest |
| Integration | Sélection d'une date → affichage de la grille de créneaux | RTL + MSW |
| Integration | Sélection d'un créneau → affichage du bouton "Confirmer" | RTL + MSW |
| Integration | Soumission du formulaire → affichage de `RdvSuccessCard` | RTL + MSW |
| Integration | Créneau 409 → toast d'erreur, formulaire toujours visible | RTL + MSW |
| E2E | Patient navigue vers /medecins/{id}/rdv, sélectionne date + créneau + confirme | Playwright |
| E2E | Après confirmation, lien "Voir mes rendez-vous" redirige vers /patient/rdvs | Playwright |

---

## 6. Justifications techniques

| Choix | Justification |
|-------|---------------|
| Machine d'état à 4 étapes sur une seule route | Évite les navigations inter-pages et perte d'état ; l'utilisateur reste sur `/rdv` tout au long du flux |
| `staleTime: 30_000` sur `useCreneaux` | Empêche les re-fetch automatiques lors des changements d'étape ; les créneaux sont valides 30 s |
| Invalidation ciblée `['creneaux', medecinId, date]` | Met à jour la disponibilité exactement pour la date réservée, sans invalider les autres dates en cache |
| Filtre `disponible === true` côté client | Le backend retourne tous les créneaux (réservés inclus) ; le filtre garde la logique simple côté serveur |
| `patientId` UUID validé par Zod | Empêche les requêtes malformées avant même de contacter l'API |
| `min={tomorrowISO()}` sur le date picker | Contrainte UI claire : impossible de réserver le jour même ou dans le passé |
| `ConfirmRdvForm` composant séparé | Testable indépendamment ; isolé des détails de fetch de la page parente |
| `RdvSuccessCard` stateless | Reçoit uniquement des props — facilement testable, réutilisable hors contexte RDV |
| localStorage session (`doctorek_session`) | Pont provisoire avant l'implémentation JWT (Sprint 5) ; session lue dans `lib/session.ts` |

---

## 7. Preuves d'exécution

```bash
# US-F05 — Récupérer les créneaux disponibles
curl "http://localhost:8080/api/v1/agenda/medecins/550e8400-e29b-41d4-a716-446655440000/creneaux?date=2026-04-20"
# {"success":true,"data":[{"id":"c1d2...","heureDebut":"09:00","heureFin":"09:30","disponible":true},...],"message":null}

# US-F06 — Prendre un rendez-vous
curl -X POST http://localhost:8080/api/v1/agenda/rdv \
  -H "Content-Type: application/json" \
  -d '{"medecinId":"550e8400-...","patientId":"660f9511-...","dateRdv":"2026-04-20","heureRdv":"09:00","motif":"Contrôle"}'
# {"success":true,"data":{"id":"rdv-uuid-...","statut":"CONFIRME",...},"message":null}

# Créneau déjà pris → 409
curl -X POST http://localhost:8080/api/v1/agenda/rdv \
  -H "Content-Type: application/json" \
  -d '{"medecinId":"550e8400-...","patientId":"770g0622-...","dateRdv":"2026-04-20","heureRdv":"09:00"}'
# {"success":false,"data":null,"message":"Ce créneau n'est plus disponible"}
```

**Screenshots** :
- `docs/screenshots/US-11-200-getCreneaux.png` — réponse API créneaux disponibles
- `docs/screenshots/US-11-200-getDisponibilites.png` — disponibilités médecin configurées
- `docs/screenshots/US-11-201-defineDisponibilite.png` — création d'une disponibilité
- `docs/screenshots/US-11-TDD.png` — suite de tests backend (TDD)
