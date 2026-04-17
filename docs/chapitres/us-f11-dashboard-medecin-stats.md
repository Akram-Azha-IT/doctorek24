# US-F11 — Dashboard médecin avec statistiques

## Description

En tant que médecin connecté, je veux voir un tableau de bord avec les statistiques du jour (RDVs confirmés / en attente / annulés), la liste des RDVs d'aujourd'hui, et le taux d'occupation de la semaine, afin d'avoir une vue d'ensemble rapide de mon activité.

## Critères d'acceptation

- 4 stat cards du jour : total RDVs, confirmés, en attente, annulés
- Liste des RDVs du jour triés par heure avec : heure, ID patient (8 premiers chars), motif, badge statut
- Barre de progression pour le taux d'occupation hebdomadaire
- Boutons "Actions rapides" (scroll vers l'agenda)
- Section agenda existante préservée en bas de page
- Fallback si aucun RDV pour aujourd'hui

## Calcul du taux d'occupation

```typescript
// Slots disponibles par créneau de disponibilité
function slotsPerDisponibilite(d: Disponibilite): number {
  const [sh, sm] = d.heureDebut.split(':').map(Number)
  const [eh, em] = d.heureFin.split(':').map(Number)
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, Math.floor(totalMinutes / d.dureeConsultation))
}

// Taux = RDVs non annulés cette semaine / total slots disponibles × 100
const occupationRate = Math.round((weekRdvs.length / totalWeeklySlots) * 100)
```

La semaine est calculée du lundi au dimanche de la semaine courante.

## Endpoint backend utilisé

```
GET /api/v1/agenda/medecins/{medecinId}/rdv
```

Réponse : `RendezVous[]` — filtrés côté frontend pour aujourd'hui et la semaine.

## Composants React impliqués

| Composant / Hook | Fichier | Rôle |
|------------------|---------|------|
| `MedecinDashboardPage` | `app/dashboard/medecin/page.tsx` | Page principale médecin |
| `StatCard` | `app/dashboard/medecin/page.tsx` | Card statistique (label + valeur) |
| `TodayRdvRow` | `app/dashboard/medecin/page.tsx` | Ligne RDV du jour |
| `useRdvsMedecin(id)` | `features/agenda/hooks.ts` | Récupère tous les RDVs du médecin |
| `useDisponibilites(id)` | `features/agenda/hooks.ts` | Récupère les disponibilités |

## Structure de la page

```
Header
└── main
    ├── Page header (date du jour)
    ├── Stats du jour (4 cards)
    ├── Taux d'occupation semaine (barre + %)
    ├── Rendez-vous du jour (liste triée)
    ├── Actions rapides (scroll vers agenda)
    └── Mon agenda (AgendaView + DisponibiliteForm)
```

## Statuts affichés dans les rows

| Statut | Couleur |
|--------|---------|
| `EN_ATTENTE` | Jaune |
| `CONFIRME` | Vert |
| `ANNULE` | Rouge |
| `TERMINE` | Gris |

## Tests manuels de validation

1. Se connecter en tant que MEDECIN
2. Accéder à `/dashboard/medecin`
3. Vérifier les 4 stat cards (valeurs cohérentes avec les RDVs du jour)
4. Vérifier la barre d'occupation (0% si aucun RDV cette semaine)
5. Vérifier la liste triée par heure des RDVs d'aujourd'hui
6. Cliquer "Gérer les disponibilités" → vérifier le scroll vers la section agenda
7. Vérifier que la section agenda reste fonctionnelle (sélection jour, DisponibiliteForm)

## Capture d'écran

> *[placeholder — ajouter screenshot du dashboard médecin]*
