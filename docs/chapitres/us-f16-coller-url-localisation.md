# US-F16 — Coller une URL de localisation sur le profil médecin

**Module** : `frontend / medecin`  
**Route** : `/dashboard/medecin/profil`  
**Stack** : Next.js · React · TypeScript · Tailwind CSS  
**Statut** : Livré — Sprint 9

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Sources d'URL supportées](#2-sources-durl-supportées)
3. [Fonction de parsing](#3-fonction-de-parsing)
4. [Intégration dans le formulaire](#4-intégration-dans-le-formulaire)
5. [UX et validation](#5-ux-et-validation)

---

## 1. Vue d'ensemble

La section **Localisation** du profil médecin propose un champ permettant de coller directement une URL de carte (Google Maps, Apple Maps, OpenStreetMap, Bing Maps) ou une paire `lat,lng` brute. Les coordonnées sont extraites automatiquement et injectées dans les champs `latitude` et `longitude` du formulaire.

Aucun appel serveur — le parsing est entièrement client-side via regex.

---

## 2. Sources d'URL supportées

| Source | Format détecté | Exemple |
|--------|---------------|---------|
| Google Maps (/@) | `/@lat,lng` | `https://www.google.com/maps/@36.7538,3.0588,15z` |
| Google Maps (?q=) | `?q=lat,lng` | `https://maps.google.com/?q=36.7538,3.0588` |
| Apple Maps | `?ll=lat,lng` | `https://maps.apple.com/?ll=36.7538,3.0588` |
| OpenStreetMap | `#map=zoom/lat/lng` | `https://www.openstreetmap.org/#map=15/36.7538/3.0588` |
| Bing Maps | `?cp=lat~lng` | `https://www.bing.com/maps?cp=36.7538~3.0588` |
| Coordonnées brutes | `lat, lng` | `36.7538, 3.0588` |

---

## 3. Fonction de parsing

```typescript
function parseMapUrl(text: string): { lat: number; lng: number } | null {
  const t = text.trim()

  // Google Maps /@lat,lng
  let m = t.match(/\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // Google Maps ?q=lat,lng
  m = t.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // Apple Maps ?ll=lat,lng
  m = t.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // OpenStreetMap #map=zoom/lat/lng
  m = t.match(/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // Bing Maps ?cp=lat~lng
  m = t.match(/[?&]cp=(-?\d+\.?\d*)~(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // Coordonnées brutes "lat, lng"
  m = t.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  return null
}
```

La fonction retourne `null` si aucun pattern ne correspond — le formulaire affiche alors un message d'erreur.

---

## 4. Intégration dans le formulaire

### État

```typescript
const [mapUrl, setMapUrl]         = useState('')
const [mapUrlError, setMapUrlError] = useState('')
```

### Handler

```typescript
function handleMapUrlPaste(text: string) {
  setMapUrl(text)
  setMapUrlError('')
  if (!text.trim()) return

  const coords = parseMapUrl(text)
  if (coords) {
    setValue('latitude', coords.lat)
    setValue('longitude', coords.lng)
  } else {
    setMapUrlError('URL non reconnue. Essayez Google Maps, Apple Maps, OSM, Bing ou "lat, lng".')
  }
}
```

### UI

```tsx
<div>
  <label>Coller un lien de carte</label>
  <input
    type="text"
    value={mapUrl}
    onChange={e => handleMapUrlPaste(e.target.value)}
    onPaste={e => handleMapUrlPaste(e.clipboardData.getData('text'))}
    placeholder="https://maps.google.com/... ou 36.7538, 3.0588"
  />
  {mapUrlError && <p className="text-red-500 text-sm">{mapUrlError}</p>}
  <p className="text-xs text-gray-400">
    Compatible Google Maps, Apple Maps, OpenStreetMap, Bing Maps
  </p>
</div>
```

---

## 5. UX et validation

| Situation | Comportement |
|-----------|-------------|
| URL Google Maps collée | Coordonnées extraites, champs lat/lng remplis |
| URL non reconnue | Message d'erreur sous le champ, champs lat/lng inchangés |
| Champ vidé | Erreur effacée, champs lat/lng inchangés |
| Coordonnées brutes `lat, lng` | Parsing direct, champs remplis |

Pas de debounce — le parsing se déclenche à chaque `onChange` et `onPaste`. La regex est O(1) en temps constant.
