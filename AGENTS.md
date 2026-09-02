# doctorek — Contexte PFE

## Stack technique
- Spring Boot 3.5.13 · Java 17
- React 18 + TypeScript (Next.js 15 App Router)
- PostgreSQL · Redis · Docker
- Architecture : Monolithe modulaire
- TanStack Query (React Query) pour la gestion du state serveur
- Zod + react-hook-form pour la validation des formulaires
- Tailwind CSS (pur, sans shadcn pour les nouveaux composants)

## Modules (9)
auth · annuaire · agenda · patient ·
consultation · notification · pharmacie · fse · paiement

---

## État actuel — 17 avril 2026

### Backend — Terminé
| Sprint | US | Endpoint | Statut |
|--------|-----|---------|--------|
| Sprint 1 | US-01 Setup Docker + Spring Boot | — | Done |
| Sprint 1 | US-02 Inscription patient | `POST /api/v1/auth/patients/register` | Done |
| Sprint 1 | US-03 Inscription médecin | `POST /api/v1/auth/medecins/register` | Done |
| Sprint 1 | US-08 Profil public médecin | `GET /api/v1/annuaire/medecins/{id}` | Done |
| Sprint 1 | US-09 Recherche spécialité+ville | `GET /api/v1/annuaire/medecins?specialite=&ville=` | Done |
| Sprint 1 | US-10 Completion profil médecin | `PUT /api/v1/annuaire/medecins/{id}` | Done |
| Sprint 3 | US-11 Agenda + disponibilités | `POST/GET /api/v1/agenda/medecins/{id}/disponibilites` | Done |
| Sprint 3 | US-12 Prise de RDV | `POST /api/v1/agenda/rdv` | Done |
| Sprint 3 | US-13 Annulation RDV | `PUT /api/v1/agenda/rdv/{id}/annuler` | Done |
| Sprint 3 | — | `GET /api/v1/agenda/medecins/{id}/creneaux?date=` | Done |
| Sprint 3 | — | `GET /api/v1/agenda/patients/{id}/rdv` | Done |
| Sprint 3 | — | `GET /api/v1/agenda/medecins/{id}/rdv` | Done |

**Non commencé backend** : US-04 à US-07 (JWT / Auth réelle)

### Frontend — Terminé
| US | Titre | Route | Statut |
|----|-------|-------|--------|
| US-F01 | Page d'accueil | `/` | Done |
| US-F02 | Recherche médecins | `/recherche` | Done |
| US-F03 | Inscription patient + médecin | `/inscription` | Done |
| US-F04 | Profil public médecin | `/medecins/[id]` | Done |
| US-F05 | Créneaux disponibles | `/medecins/[id]/rdv` | Done |
| US-F06 | Prise de RDV patient | `/medecins/[id]/rdv` | Done |
| US-F07 | Liste RDV patient | `/patient/rdvs` | Done |
| US-F08 | Annulation RDV inline | `/patient/rdvs` | Done |
| — | Login (session simulée) | `/login` | Done |
| — | Dashboard patient | `/dashboard/patient` | Done |
| — | Dashboard médecin | `/dashboard/medecin` | Done |
| — | Role-based routing + guards | Header/guards | Done |
| US-F09 | Profil médecin enrichi (avatar HSL, secteur tarifaire, langues) | `/medecins/[id]` | Done |
| US-F10 | Questionnaire pré-consultation | `/medecins/[id]/rdv` | Done |
| US-F11 | Dashboard médecin avec stats | `/dashboard/medecin` | Done |

---

## Prochain sprint — Sprint 7 : JWT & Auth réelle

### Priorité absolue : US-04 à US-07
| US | Titre | Points | Statut |
|----|-------|--------|--------|
| US-04 | Connexion + JWT Access Token | 5 pts | Backlog |
| US-05 | Refresh Token rotation | 3 pts | Backlog |
| US-06 | RBAC (PATIENT/MEDECIN/ADMIN) | 3 pts | Backlog |
| US-07 | Déconnexion + invalidation token | 2 pts | Backlog |

Voir plan détaillé dans `.Codex/plan/next-steps-roadmap.md`

---

## Architecture frontend

### Structure des fichiers
```
doctorek-frontend/
├── app/                          # Next.js App Router (pages)
│   ├── page.tsx                  # US-F01 Accueil
│   ├── login/page.tsx            # Login (session simulée)
│   ├── inscription/page.tsx      # US-F03 Inscription
│   ├── recherche/page.tsx        # US-F02 Recherche
│   ├── medecins/[id]/page.tsx    # US-F04 Profil médecin
│   ├── medecins/[id]/rdv/page.tsx # US-F05/F06 Créneaux + prise RDV
│   ├── patient/rdvs/page.tsx     # US-F07/F08 Liste + annulation RDV
│   ├── dashboard/patient/page.tsx # Dashboard patient
│   └── dashboard/medecin/page.tsx # US-F11 Dashboard médecin avec stats
├── features/
│   ├── annuaire/
│   │   ├── api.ts                # getMedecins, getMedecinById
│   │   ├── hooks.ts              # useMedecins, useMedecinById
│   │   └── components/
│   │       ├── MedecinAvatar.tsx # US-F09 Avatar initiales + couleur HSL
│   │       ├── MedecinCard.tsx   # US-F09 Card annuaire (secteur tarifaire)
│   │       └── MedecinProfileCard.tsx # US-F09 Page profil complet
│   └── agenda/
│       ├── api.ts                # getCreneaux, prendreRdv, annulerRdv, getRdvsMedecin, getDisponibilites
│       ├── hooks.ts              # useCreneaux, usePrendreRdv, useAnnulerRdv, useRdvsMedecin, useDisponibilites
│       ├── schemas.ts            # Zod: PrendreRdvSchema (avec questionnaire)
│       └── components/
│           ├── ConfirmRdvForm.tsx # US-F10 Questionnaire pré-consultation complet
│           ├── AgendaView.tsx    # Vue agenda médecin (semaine/mois/an)
│           └── DisponibiliteForm.tsx # Gestion disponibilités
├── components/
│   ├── Header.tsx                # Navigation role-based
│   └── HeaderAuth.tsx            # Boutons auth session-aware
└── lib/
    ├── types.ts                  # Tous les types TypeScript
    ├── api-client.ts             # apiFetch() wrapper
    ├── session.ts                # saveSession / getSession (localStorage simulé)
    └── useRoleGuard.ts           # Guard de route par rôle
```

### Types clés (lib/types.ts)
```typescript
interface MedecinProfile {
  id: string; firstName: string; lastName: string
  specialite: string; ville: string; adresse: string; inpe: string
  secteurTarifaire?: 1 | 2 | 3    // US-F09
  langues?: string[]               // US-F09
  presentation?: string            // US-F09
  acceptNouveauxPatients?: boolean // US-F09
}

interface QuestionnairePreConsult {   // US-F10
  motif: string
  premierConsultation: boolean
  intensiteDouleur?: 1 | 2 | 3 | 4 | 5
  dureeSymptoomes?: 'moins_7j' | '1_4sem' | 'plus_1mois' | null
  notesComplementaires?: string
}

interface RendezVous {
  id: string; medecinId: string; patientId: string
  dateRdv: string; heureRdv: string; duree: number
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE'
  motif: string | null
  questionnaire?: QuestionnairePreConsult | null  // US-F10
  createdAt: string
}

interface Disponibilite {
  id: string; medecinId: string; jourSemaine: string
  heureDebut: string; heureFin: string; dureeConsultation: number
}
```

### Session (simulée — pas encore JWT)
```typescript
// lib/session.ts
saveSession({ id, role, firstName, lastName })
getSession() → { id, role, firstName, lastName } | null
```
La session est stockée en localStorage. Le login appelle directement l'API inscription et sauvegarde l'ID. **Remplacer par JWT en Sprint 7.**

---

## Conventions de commits
feat · fix · chore · test · docs

## Règles importantes
- Pas de secrets dans le code (.env uniquement)
- Tests JUnit 5 obligatoires pour chaque endpoint backend
- Swagger documenté pour chaque API
- Frontend : Tailwind pur pour les nouveaux composants (pas de shadcn)
- Toujours lire les user stories dans `docs/chapitres/` avant d'implémenter
- Consulter `.Codex/plan/` pour le plan détaillé des prochaines phases
