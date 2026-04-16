# US-F07 — Liste des rendez-vous patient

## Description

En tant que patient connecté, je veux consulter la liste de tous mes rendez-vous passés et à venir afin de suivre mon historique médical et gérer mes prochaines consultations.

## Critères d'acceptation

- La page `/patient/rdvs` est accessible uniquement aux utilisateurs authentifiés avec le rôle `PATIENT`
- Chaque card affiche : nom du médecin, spécialité, date en français, heure, statut coloré
- Les rendez-vous sont listés par ordre chronologique décroissant
- Un message vide est affiché si aucun rendez-vous n'existe

## Endpoint backend utilisé

```
GET /api/rdvs/patient/{patientId}
```

Réponse : `RendezVous[]` avec `medecinId`, `dateRdv`, `heureRdv`, `statut`, `motif`

## Composants React impliqués

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `PatientRdvsPage` | `app/patient/rdvs/page.tsx` | Page principale, charge les RDVs |
| `RdvCard` | `app/patient/rdvs/page.tsx` | Affiche un seul RDV avec médecin |
| `useRdvsPatient(id)` | `features/agenda/hooks.ts` | Récupère les RDVs du patient |
| `useMedecin(id)` | `features/annuaire/hooks.ts` | Récupère le profil médecin par ID |
| `useRoleGuard('PATIENT')` | `lib/useRoleGuard.ts` | Redirige si non PATIENT |

## Format de date

```typescript
function formatDateFR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
// "2026-04-21" → "mardi 21 avril 2026"
```

## Statuts affichés

| Statut | Label | Couleur |
|--------|-------|---------|
| `EN_ATTENTE` | En attente | Jaune |
| `CONFIRME` | Confirmé | Vert |
| `ANNULE` | Annulé | Rouge |
| `TERMINE` | Terminé | Gris |

## Tests manuels de validation

1. Se connecter en tant que PATIENT avec un UUID valide
2. Naviguer vers `/patient/rdvs`
3. Vérifier que chaque card affiche "Dr Prénom Nom" et la spécialité
4. Vérifier que la date est au format "lundi 21 avril 2026"
5. Se connecter en tant que MEDECIN → vérifier la redirection vers `/dashboard/medecin`
6. Accéder sans session → vérifier la redirection vers `/login`

## Capture d'écran

> *[placeholder — ajouter screenshot de la liste RDV]*
