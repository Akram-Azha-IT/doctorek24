# US-F09 — Profil enrichi médecin

## Description

En tant que patient, je veux voir une fiche médecin enrichie (avatar, secteur tarifaire, langues, présentation, acceptation nouveaux patients) afin de choisir un médecin avec plus d'informations.

## Critères d'acceptation

- La `MedecinCard` dans l'annuaire affiche l'avatar, la spécialité, la ville, le secteur tarifaire (badge S1/S2/S3), et un indicateur "Accepte nouveaux patients"
- La `MedecinProfileCard` affiche en plus : présentation, langues parlées
- L'avatar est généré à partir des initiales avec une couleur HSL déterministe (pas d'image requise)
- Le design est en Tailwind pur, sans shadcn

## Nouveaux champs dans `MedecinProfile`

```typescript
interface MedecinProfile {
  // …champs existants
  secteurTarifaire?: 1 | 2 | 3
  langues?: string[]
  presentation?: string
  acceptNouveauxPatients?: boolean
}
```

## Composants React impliqués

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `MedecinAvatar` | `features/annuaire/components/MedecinAvatar.tsx` | Avatar initiales + couleur HSL |
| `MedecinCard` | `features/annuaire/components/MedecinCard.tsx` | Card liste annuaire |
| `MedecinProfileCard` | `features/annuaire/components/MedecinProfileCard.tsx` | Page profil complet |

## Logique de l'avatar

```typescript
function hslFromString(s: string): string {
  let hash = 0
  for (const c of s) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffff
  return `hsl(${hash % 360}, 55%, 48%)`
}
```

Les initiales sont extraites du prénom + nom (ex. "Jean Dupont" → "JD").

## Sizes disponibles

| Size | Classe | Usage |
|------|--------|-------|
| `sm` | `w-9 h-9 text-sm` | Compact |
| `md` | `w-12 h-12 text-base` | Card liste |
| `lg` | `w-16 h-16 text-xl` | Page profil |

## Badges secteur tarifaire

| Valeur | Label | Couleur |
|--------|-------|---------|
| `1` | Secteur 1 | Vert |
| `2` | Secteur 2 | Bleu |
| `3` | Secteur 3 | Violet |

## Tests manuels de validation

1. Accéder à `/medecins` — vérifier que chaque card affiche un avatar coloré avec initiales
2. Vérifier que le badge S1/S2/S3 apparaît si `secteurTarifaire` est défini
3. Vérifier l'indicateur vert/rouge pour `acceptNouveauxPatients`
4. Accéder à la page profil d'un médecin — vérifier la présentation et les langues

## Capture d'écran

> *[placeholder — ajouter screenshot de la MedecinCard enrichie]*
