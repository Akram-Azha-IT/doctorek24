# US-F08 — Annulation d'un rendez-vous (Frontend)

## Description

En tant que patient connecté, je veux pouvoir annuler un rendez-vous en attente ou confirmé directement depuis ma liste de rendez-vous, avec une confirmation inline avant l'action définitive.

## Critères d'acceptation

- Un bouton "Annuler" est visible uniquement pour les RDVs avec statut `EN_ATTENTE` ou `CONFIRME`
- Un clic sur "Annuler" affiche une confirmation inline (boutons "Oui" / "Non") sans modal
- La confirmation envoie la requête d'annulation au backend
- Un toast de succès est affiché après annulation
- La liste se rafraîchit automatiquement (React Query invalidation)
- Les RDVs `ANNULE` et `TERMINE` n'ont pas de bouton d'annulation

## Endpoint backend utilisé

```
DELETE /api/rdvs/{rdvId}/annuler?patientId={patientId}
```

## Composants React impliqués

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `PatientRdvsPage` | `app/patient/rdvs/page.tsx` | Gère l'état `confirmingId` |
| `RdvCard` | `app/patient/rdvs/page.tsx` | Affiche bouton + confirmation inline |
| `useAnnulerRdv(patientId)` | `features/agenda/hooks.ts` | Mutation DELETE + invalidation |

## Flux d'interaction

```
[Liste RDVs]
    ↓ Clic "Annuler"
[Confirmation inline : "Confirmer ? [Oui] [Non]"]
    ↓ Clic "Oui"
[DELETE /api/rdvs/{id}/annuler]
    ↓ Succès
[Toast "Rendez-vous annulé" + liste rafraîchie]
    ↓ Clic "Non"
[Retour à l'affichage normal]
```

## Gestion d'état

```typescript
const [confirmingId, setConfirmingId] = useState<string | null>(null)

// Déclenche la confirmation
onConfirmStart: (id) => setConfirmingId(id)

// Annule la confirmation
onConfirmCancel: () => setConfirmingId(null)

// Exécute l'annulation
onAnnuler: (id) => annuler(id, { onSuccess, onError })
```

## Tests manuels de validation

1. Se connecter en tant que PATIENT
2. Naviguer vers `/patient/rdvs`
3. Cliquer "Annuler" sur un RDV `EN_ATTENTE` → vérifier l'affichage de la confirmation
4. Cliquer "Non" → vérifier le retour à l'état normal
5. Cliquer "Annuler" puis "Oui" → vérifier le toast de succès
6. Vérifier que le statut de la card passe à "Annulé" (rouge)
7. Vérifier qu'un RDV `ANNULE` ou `TERMINE` ne montre pas le bouton "Annuler"

## Capture d'écran

> *[placeholder — ajouter screenshot de la confirmation inline]*
