# US-F10 — Questionnaire pré-consultation

## Description

En tant que patient, je veux remplir un questionnaire structuré lors de la prise de rendez-vous (motif, premier RDV, durée symptômes, intensité, notes) afin de préparer ma consultation.

## Critères d'acceptation

- Champ motif obligatoire (texte libre, max 255 caractères)
- Toggle "Premier rendez-vous" Oui/Non (pill buttons)
- Durée des symptômes : 3 options en chip sélectionnable (optionnel, toggle off possible)
- Intensité de la gêne : sélecteur 1–5 (optionnel, toggle off possible)
- Notes complémentaires : textarea libre (optionnel, max 500 caractères)
- Questionnaire collapsible dans `RdvCard` patient (bouton "Détails")

## Schéma Zod

```typescript
// features/agenda/schemas.ts
export const PrendreRdvSchema = z.object({
  patientId: z.string().uuid(),
  questionnaire: z.object({
    motif: z.string().min(1).max(255),
    premierConsultation: z.boolean(),
    dureeSymptoomes: z.enum(['moins_7j', '1_4sem', 'plus_1mois']).nullable().optional(),
    intensiteDouleur: z.union([z.literal(1), …z.literal(5)]).nullable().optional(),
    notesComplementaires: z.string().max(500).optional(),
  }),
})
```

## Type backend

```typescript
// lib/types.ts
interface QuestionnairePreConsult {
  motif: string
  premierConsultation: boolean
  intensiteDouleur?: 1 | 2 | 3 | 4 | 5
  dureeSymptoomes?: 'moins_7j' | '1_4sem' | 'plus_1mois' | null
  notesComplementaires?: string
}

interface RendezVous {
  // …
  questionnaire?: QuestionnairePreConsult | null
}
```

## Payload API

```
POST /api/v1/agenda/rdv
{
  medecinId, patientId, dateRdv, heureRdv,
  questionnaire: {
    motif: "Douleurs dorsales",
    premierConsultation: true,
    dureeSymptoomes: "1_4sem",
    intensiteDouleur: 3,
    notesComplementaires: "…"
  }
}
```

## Composants React impliqués

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ConfirmRdvForm` | `features/agenda/components/ConfirmRdvForm.tsx` | Formulaire prise RDV avec questionnaire |
| `QuestionnaireDetails` | `app/patient/rdvs/page.tsx` | Panneau collapsible dans RdvCard |
| `PrendreRdvSchema` | `features/agenda/schemas.ts` | Validation Zod |

## Options durée des symptômes

| Valeur | Label affiché |
|--------|---------------|
| `moins_7j` | Moins de 7 jours |
| `1_4sem` | 1 à 4 semaines |
| `plus_1mois` | Plus d'un mois |

## Tests manuels de validation

1. Accéder à `/medecins/{id}/rdv`, sélectionner un créneau
2. Vérifier que le motif est obligatoire (erreur si vide)
3. Cliquer Oui/Non pour premier RDV — vérifier le style actif
4. Sélectionner une durée de symptômes — recliquer pour désélectionner
5. Sélectionner une intensité 1–5 — recliquer pour désélectionner
6. Soumettre et aller sur `/patient/rdvs`
7. Cliquer "Détails" sur la card — vérifier l'affichage du questionnaire

## Capture d'écran

> *[placeholder — ajouter screenshot du formulaire questionnaire]*
