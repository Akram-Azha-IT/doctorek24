# US-F15 — Carte interactive sur la page Recherche

**Module** : `frontend / annuaire`  
**Route** : `/recherche`  
**Stack** : Next.js · React · TypeScript · Leaflet · Tailwind CSS  
**Statut** : Livré — Sprint 9

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture](#2-architecture)
3. [Composant DoctorMap](#3-composant-doctormap)
4. [Interaction hover → carte](#4-interaction-hover--carte)
5. [Icônes SVG teardrop](#5-icônes-svg-teardrop)
6. [Problèmes techniques résolus](#6-problèmes-techniques-résolus)
7. [Justifications techniques](#7-justifications-techniques)

---

## 1. Vue d'ensemble

La page `/recherche` affiche une carte Leaflet en parallèle de la liste des médecins. Chaque médecin est représenté par une épingle SVG. Survoler une carte médecin :

- Surligne l'épingle correspondante en rouge (plus grande)
- Déclenche un `flyTo` animé vers ce médecin sur la carte

```
Liste médecins           Carte Leaflet
┌──────────────┐        ┌──────────────────────┐
│ Dr. Ahmed    │ hover→ │   📍 (rouge agrandi)  │
│ Dr. Benali   │        │  📍 📍                │
└──────────────┘        └──────────────────────┘
```

---

## 2. Architecture

```
app/
└── recherche/
    └── page.tsx                   ← hoveredId state, mapDoctors memo, dynamic import

features/
└── annuaire/
    └── components/
        ├── DoctorMap.tsx          ← composant Leaflet (client-only)
        └── MedecinCardList.tsx    ← onMouseEnter/onMouseLeave props
```

### Import dynamique obligatoire

Leaflet manipule `window` et `document` — incompatible SSR. Import via `next/dynamic` :

```typescript
// app/recherche/page.tsx
const DoctorMap = dynamic(
  () => import('@/features/annuaire/components/DoctorMap').then(m => m.DoctorMap),
  { ssr: false }
)
```

### État hoveredId

```typescript
const [hoveredId, setHoveredId] = useState<string | null>(null)

const mapDoctors = useMemo<DoctorMapEntry[]>(
  () =>
    (data ?? [])
      .filter(d => d.lat != null && d.lng != null)
      .map(d => ({ id: d.id, lat: d.lat!, lng: d.lng!, name: `Dr. ${d.firstName} ${d.lastName}` })),
  [data]
)
```

---

## 3. Composant DoctorMap

### Interface

```typescript
export interface DoctorMapEntry {
  id: string
  lat: number
  lng: number
  name: string
}

interface DoctorMapProps {
  doctors: DoctorMapEntry[]
  hoveredId: string | null
  center?: { lat: number; lng: number }
}
```

### Trois effets React

| Effet | Dépendances | Rôle |
|-------|-------------|------|
| Init | `[]` | Import Leaflet async, créer la map, stocker `L` dans `lRef`, poser `mapReady = true` |
| syncMarkers | `[doctors, mapReady]` | Ajouter/supprimer marqueurs, `fitBounds` |
| updateHover | `[hoveredId, doctors, mapReady]` | `setIcon` sur tous les marqueurs, `flyTo` sur le survolé |

### Pattern mapReady

```typescript
const [mapReady, setMapReady] = useState(false)
const lRef = useRef<typeof import('leaflet') | null>(null)

// Dans init():
lRef.current = L
mapRef.current = map
setMapReady(true)

// Dans syncMarkers et updateHover :
const L = lRef.current
const map = mapRef.current
if (!mapReady || !map || !L) return
```

`mapReady` garantit que `syncMarkers` et `updateHover` ne s'exécutent qu'après la résolution de l'import async de Leaflet.

---

## 4. Interaction hover → carte

```typescript
// updateHover effect
for (const [id, marker] of markersRef.current) {
  marker.setIcon(makePinIcon(L, id === hoveredId))
}

if (hoveredId) {
  const doc = doctors.find(d => d.id === hoveredId)
  if (doc) map.flyTo([doc.lat, doc.lng], 15, { duration: 0.7 })
} else if (doctors.length > 0) {
  const points = doctors.map(d => [d.lat, d.lng] as [number, number])
  map.fitBounds(points, { padding: [40, 40], maxZoom: 13 })
}
```

Aucun appel serveur — tout est client-side. Le `flyTo` est une animation Leaflet native.

---

## 5. Icônes SVG teardrop

```typescript
const COLOR_DEFAULT = '#1863A9'  // Brand Blue
const COLOR_HOVERED = '#E01E5A'  // Red (design system)

function makePinIcon(L: typeof import('leaflet'), hovered: boolean) {
  const color = hovered ? COLOR_HOVERED : COLOR_DEFAULT
  const w = hovered ? 32 : 24
  const h = hovered ? 48 : 36
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36"
    width="${w}" height="${h}">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12
             C24 5.373 18.627 0 12 0z"
      fill="${color}" stroke="white" stroke-width="1.2"/>
    <circle cx="12" cy="12" r="4.5" fill="white"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    tooltipAnchor: [0, -h],
  })
}
```

| État | Couleur | Taille |
|------|---------|--------|
| Normal | `#1863A9` Brand Blue | 24×36 px |
| Survolé | `#E01E5A` Red | 32×48 px |

---

## 6. Problèmes techniques résolus

### Race condition React Strict Mode

React Strict Mode double-fire les effets en développement. L'import async de Leaflet peut se résoudre après le cleanup de la première exécution.

**Fix** : flag `cancelled` + guard `_leaflet_id` + cleanup complet.

```typescript
let cancelled = false

async function init() {
  const L = (await import('leaflet')).default
  if (cancelled || !containerRef.current) return
  if ((containerRef.current as any)._leaflet_id) return
  // ...
}

return () => {
  cancelled = true
  mapRef.current?.remove()
  mapRef.current = null
  lRef.current = null
  ;(containerRef.current as any)._leaflet_id = undefined
}
```

### `TypeError: marker.setIcon is not a function`

Plusieurs `await import('leaflet')` dans des effets différents peuvent retourner des instances de module divergentes. Les marqueurs créés avec l'instance A ne reconnaissent pas les méthodes de l'instance B.

**Fix** : une seule instance `L` cachée dans `lRef` après init. Tous les effets lisent `lRef.current` de façon synchrone — plus aucun import async après l'initialisation.

---

## 7. Justifications techniques

| Choix | Justification |
|-------|---------------|
| Leaflet vanilla (pas react-leaflet) | Contrôle total du cycle de vie, évite les incompatibilités Next.js/SSR |
| `next/dynamic` + `ssr: false` | Leaflet accède à `window` — ne peut pas s'exécuter côté serveur |
| `lRef` pour cacher L | Évite les divergences d'instances entre effets async |
| `mapReady` state | Séquence garantie : init → syncMarkers → updateHover |
| `flyTo` Leaflet natif | Animation fluide, aucun coût serveur |
| `fitBounds` au dé-hover | Recentre automatiquement sur tous les résultats |
