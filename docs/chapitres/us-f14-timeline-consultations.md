# US-F14 — Timeline des consultations

## Description

> En tant que **patient**, je veux visualiser mes rendez-vous sous forme de **timeline verticale** regroupée par section (Aujourd'hui / À venir / Passés), afin de suivre rapidement mon historique médical et mes prochaines consultations.

## Critères d'acceptation

- La page `/patient/rdvs` affiche une timeline verticale en remplacement (ou au-dessus) de la liste plate.
- Trois sections sont rendues, **toujours dans cet ordre** :
  1. **Aujourd'hui** — RDV dont la date est égale à aujourd'hui (heure locale)
  2. **À venir** — RDV strictement postérieurs à aujourd'hui, triés par date+heure ascendant
  3. **Passés** — RDV strictement antérieurs à aujourd'hui, triés par date+heure descendant
- Chaque entrée affiche : nom du médecin (`Dr Firstname Lastname`), date et heure FR, motif, statut.
- Une **pastille colorée** indique le statut (`EN_ATTENTE` jaune, `CONFIRME` emerald, `ANNULE` rouge, `TERMINE` zinc).
- Un **rail vertical** relie les entrées d'une même section (sauf le dernier item).
- Les entrées avec questionnaire pré-consultation exposent un toggle « Détails » / « Masquer ».
- L'**annulation** est possible inline avec confirmation (« Confirmer ? » / Oui / Non).
- Si aucun RDV : empty state pointillé « Aucun rendez-vous trouvé ».

## Algorithme de regroupement — `lib/rdv-timeline.ts`

```typescript
export type RdvSection = 'today' | 'upcoming' | 'past';

export interface GroupedRdvs {
  today: RendezVous[];
  upcoming: RendezVous[];
  past: RendezVous[];
}

export function groupRdvsBySection(rdvs: RendezVous[], now = new Date()): GroupedRdvs {
  const today = formatDateISO(now);
  const buckets: GroupedRdvs = { today: [], upcoming: [], past: [] };

  for (const rdv of rdvs) {
    if (rdv.dateRdv === today)        buckets.today.push(rdv);
    else if (rdv.dateRdv > today)     buckets.upcoming.push(rdv);
    else                              buckets.past.push(rdv);
  }

  buckets.today.sort(byDateTimeAsc);
  buckets.upcoming.sort(byDateTimeAsc);
  buckets.past.sort(byDateTimeDesc);

  return buckets;
}
```

> La comparaison `rdv.dateRdv === today` repose sur le format ISO `YYYY-MM-DD` calculé en **timezone locale** via `parseDateLocal` (`new Date(year, month - 1, day)`), évitant le décalage UTC sur les clients hors UTC.

## Composants React impliqués

| Composant                                                       | Rôle                                                                  |
|-----------------------------------------------------------------|-----------------------------------------------------------------------|
| `app/patient/rdvs/page.tsx`                                     | Charge `useRdvsPatient`, appelle `groupRdvsBySection`, rend `<RdvTimeline>` |
| `features/agenda/components/RdvTimeline.tsx`                    | Wrapper : 3 `<TimelineSection>` ordonnées, empty state              |
| `features/agenda/components/RdvTimelineItem.tsx`                | Item individuel : rail + dot + carte + questionnaire + annulation   |
| `lib/rdv-timeline.ts`                                           | `groupRdvsBySection` + helpers de tri                                 |

## Structure visuelle

```
┌──────────────────────────────────────────────────┐
│ Aujourd'hui                                       │
│ ●  Dr Alice Martin — 14h30                        │
│ │   Motif : douleurs lombaires                    │
│ │   [statut: CONFIRME]   [Détails]   [Annuler]    │
│ ●  Dr Bob Durand — 17h00                          │
│     ...                                           │
│                                                  │
│ À venir                                           │
│ ●  Dr Claire Petit — 25 avril 2026 à 10h00        │
│     ...                                           │
│                                                  │
│ Passés                                            │
│ ●  Dr ... — 12 avril 2026                         │
└──────────────────────────────────────────────────┘
```

### Rail vertical

```tsx
{!isLast && (
  <span className="absolute left-[15px] top-6 bottom-[-12px] w-px bg-zinc-200" />
)}
```

### Couleur du dot par statut

```typescript
const DOT_COLORS = {
  EN_ATTENTE: 'bg-amber-400 ring-amber-100',
  CONFIRME:   'bg-emerald-500 ring-emerald-100',
  ANNULE:     'bg-red-500 ring-red-100',
  TERMINE:    'bg-zinc-400 ring-zinc-100',
};
```

## Questionnaire pré-consultation embarqué

L'item utilise un `useState(false)` local pour basculer l'affichage du `<QuestionnaireDetails>` lorsque `rdv.questionnaire` est non nul. Le bouton bascule entre **« Détails »** et **« Masquer »**.

## Annulation inline

```tsx
const [confirming, setConfirming] = useState(false);
const annuler = useAnnulerRdv();

// État 1 : bouton "Annuler"
// État 2 : "Confirmer ?" + boutons "Oui" / "Non"
// Sur "Oui" → annuler.mutate(rdv.id) → toast Sonner + invalidation queryKey
```

## Locale française

- Date longue : `Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })`
- Heure : `HH'h'mm` (ex. `14h30`)

## Tests manuels de validation

1. **Trois sections visibles :**
   - Créer 3 RDV : un aujourd'hui, un demain, un la semaine dernière → vérifier l'ordre des sections.
2. **Tri intra-section :**
   - Créer 2 RDV aujourd'hui à 09h00 et 14h00 → vérifier l'ordre ascendant.
   - Créer 2 RDV passés (J-1, J-7) → vérifier l'ordre descendant (le plus récent en haut).
3. **Rail :**
   - Vérifier la ligne verticale reliant les dots, absente sous le dernier item d'une section.
4. **Couleurs de dot :**
   - Pour chaque statut (EN_ATTENTE, CONFIRME, ANNULE, TERMINE), vérifier la couleur du dot.
5. **Questionnaire :**
   - RDV avec questionnaire → bouton « Détails » → bascule sur « Masquer » et affiche les champs.
   - RDV sans questionnaire → bouton absent.
6. **Annulation inline :**
   - Cliquer « Annuler » → affiche « Confirmer ? » → « Non » revient en arrière, « Oui » déclenche la mutation.
   - Toast Sonner « RDV annulé » + le statut passe à `ANNULE` (dot rouge) sans recharger la page.
7. **Empty state :**
   - Compte sans RDV → bloc pointillé « Aucun rendez-vous trouvé ».
8. **Timezone safety :**
   - Tester sur Windows (timezone non-UTC) → un RDV de demain ne tombe **pas** dans « Aujourd'hui ».
9. **Nom du médecin :**
   - Vérifier que `useMedecin(rdv.medecinId)` affiche bien `Dr Firstname Lastname` et non l'UUID.

## Capture d'écran

`docs/captures/us-f14-timeline-aujourdhui.png`
`docs/captures/us-f14-timeline-questionnaire.png`
`docs/captures/us-f14-empty-state.png`
