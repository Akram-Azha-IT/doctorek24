# US-F03 — Inscription Patient & Médecin (Frontend)

**Module** : `frontend / auth`  
**Route** : `/inscription`  
**Stack** : Next.js 16 · React 19 · TypeScript · React Hook Form · Zod · TanStack Query v5  
**Appels API** :  
  - `POST /api/v1/auth/register/patient`  
  - `POST /api/v1/auth/register/medecin`  
**Statut** : Livré — Sprint 2 Frontend MVP

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture en couches (Frontend)](#2-architecture-en-couches-frontend)
3. [Design patterns utilisés](#3-design-patterns-utilisés)
4. [Contrat d'API consommé](#4-contrat-dapi-consommé)
5. [Validation Zod](#5-validation-zod)
6. [Stratégie de test](#6-stratégie-de-test)
7. [Justifications techniques](#7-justifications-techniques)
8. [Preuves d'exécution](#8-preuves-dexécution)

---

## 1. Vue d'ensemble

La page `/inscription` présente un formulaire d'inscription avec **deux onglets** : Patient et Médecin. Chaque onglet charge un formulaire adapté au rôle, avec validation Zod côté client avant toute requête.

Flux global :

```
Utilisateur arrive sur /inscription
        ↓
    Onglet Patient (défaut) | Onglet Médecin
        ↓
    Saisie du formulaire
        ↓
    Validation Zod (client-side)
        ↓ (si valide)
    POST /api/v1/auth/register/patient
    ou
    POST /api/v1/auth/register/medecin
        ↓
    Succès → message de confirmation
    Erreur → message d'erreur affiché
```

Le formulaire **Patient** collecte : prénom, nom, email, téléphone, mot de passe, confirmation.

Le formulaire **Médecin** collecte en plus : INPE (10 chiffres), spécialité, ville, adresse.

---

## 2. Architecture en couches (Frontend)

```
app/
└── inscription/
    └── page.tsx                          ← gestion des onglets (état local)

features/
└── auth/
    ├── api.ts                            ← registerPatient(), registerMedecin()
    ├── schemas.ts                        ← RegisterSchema, RegisterMedecinSchema (Zod)
    └── components/
        ├── RegisterForm.tsx              ← formulaire patient (React Hook Form + Zod)
        └── RegisterMedecinForm.tsx       ← formulaire médecin (champs supplémentaires)

lib/
└── api-client.ts                         ← apiFetch<T> — wrapper HTTP centralisé
```

### Flux de données

```
InscriptionPage (état: 'patient' | 'medecin')
    │
    ├── TabButton "Patient"  → setTab('patient')
    ├── TabButton "Médecin"  → setTab('medecin')
    │
    ├── tab === 'patient' → <RegisterForm />
    │       │
    │       ├── useForm<RegisterFormValues>({ resolver: zodResolver(RegisterSchema) })
    │       └── onSubmit → registerPatient(data) → apiFetch POST /register/patient
    │
    └── tab === 'medecin' → <RegisterMedecinForm />
            │
            ├── useForm<RegisterMedecinFormValues>({ resolver: zodResolver(RegisterMedecinSchema) })
            └── onSubmit → registerMedecin(data) → apiFetch POST /register/medecin
```

---

## 3. Design patterns utilisés

### Onglets par état local

La page gère l'onglet actif via un `useState` simple — pas de routing, pas de store global. Les formulaires sont montés/démontés à la volée.

```typescript
// app/inscription/page.tsx
const [tab, setTab] = useState<'patient' | 'medecin'>('patient')

return (
  <div>
    <TabButton active={tab === 'patient'} onClick={() => setTab('patient')}>Patient</TabButton>
    <TabButton active={tab === 'medecin'} onClick={() => setTab('medecin')}>Médecin</TabButton>

    {tab === 'patient' ? <RegisterForm /> : <RegisterMedecinForm />}
  </div>
)
```

### React Hook Form + Zod (Resolver)

Intégration via `@hookform/resolvers/zod`. La validation Zod est déclarée séparément dans `schemas.ts` et injectée comme `resolver` — découplage entre la définition des règles et le formulaire.

```typescript
const form = useForm<RegisterFormValues>({
  resolver: zodResolver(RegisterSchema),
  defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' }
})
```

### Composition de schémas Zod (héritage)

Le schéma médecin réutilise les champs de base du patient via spread :

```typescript
// features/auth/schemas.ts
const baseFields = {
  firstName:       z.string().min(2, 'Prénom requis (min 2 caractères)'),
  lastName:        z.string().min(2, 'Nom requis (min 2 caractères)'),
  email:           z.string().email('Email invalide'),
  phone:           z.string().regex(/^(\+213|0)[5-7]\d{8}$/, 'Numéro algérien invalide (ex: 0612345678)'),
  password:        z.string().min(8, 'Mot de passe minimum 8 caractères'),
  confirmPassword: z.string(),
}

export const RegisterSchema = z.object(baseFields)
  .refine(d => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const RegisterMedecinSchema = z.object({
  ...baseFields,
  inpe:      z.string().regex(/^\d{10}$/, 'INPE doit contenir exactement 10 chiffres'),
  specialite: z.string().min(2, 'Spécialité requise'),
  ville:      z.string().min(2, 'Ville requise'),
  adresse:    z.string().min(5, 'Adresse requise'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})
```

### API Layer isolée

```typescript
// features/auth/api.ts
export function registerPatient(data: RegisterFormValues): Promise<void> {
  return apiFetch('/api/v1/auth/register/patient', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function registerMedecin(data: RegisterMedecinFormValues): Promise<void> {
  return apiFetch('/api/v1/auth/register/medecin', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

---

## 4. Contrat d'API consommé

### `POST /api/v1/auth/register/patient`

**Corps de la requête :**

```json
{
  "firstName": "Sarah",
  "lastName": "Amrani",
  "email": "sarah@example.com",
  "phone": "0612345678",
  "password": "motdepasse123",
  "confirmPassword": "motdepasse123"
}
```

**Réponse 201 Created :**

```json
{
  "success": true,
  "data": { "message": "Inscription réussie" },
  "message": null
}
```

### `POST /api/v1/auth/register/medecin`

Même structure + champs supplémentaires :

```json
{
  "firstName": "Karim",
  "lastName": "Benali",
  "email": "karim@example.com",
  "phone": "0712345678",
  "password": "motdepasse123",
  "confirmPassword": "motdepasse123",
  "inpe": "1234567890",
  "specialite": "Cardiologie",
  "ville": "Alger",
  "adresse": "10 Rue Didouche Mourad"
}
```

---

## 5. Validation Zod

### Stratégie en deux couches

| Couche | Outil | Déclenchement |
|--------|-------|---------------|
| Client | Zod + React Hook Form | À la soumission + à la perte de focus |
| Serveur | Bean Validation (`@NotBlank`, `@Email`, etc.) | Toujours, même si client bypassed |

### Règles de validation

| Champ | Règle | Message d'erreur |
|-------|-------|-----------------|
| `firstName` | min 2 caractères | Prénom requis (min 2 caractères) |
| `lastName` | min 2 caractères | Nom requis (min 2 caractères) |
| `email` | format email valide | Email invalide |
| `phone` | regex `^(\+213\|0)[5-7]\d{8}$` | Numéro algérien invalide (ex: 0612345678) |
| `password` | min 8 caractères | Mot de passe minimum 8 caractères |
| `confirmPassword` | === `password` | Les mots de passe ne correspondent pas |
| `inpe` *(médecin)* | regex `^\d{10}$` | INPE doit contenir exactement 10 chiffres |
| `specialite` *(médecin)* | min 2 caractères | Spécialité requise |
| `ville` *(médecin)* | min 2 caractères | Ville requise |
| `adresse` *(médecin)* | min 5 caractères | Adresse requise |

---

## 6. Stratégie de test

| Type | Scénario | Outil |
|------|----------|-------|
| Unit | `RegisterSchema` valide les bons champs | Vitest |
| Unit | `RegisterSchema` rejette email invalide | Vitest |
| Unit | `RegisterMedecinSchema` rejette INPE non numérique | Vitest |
| Unit | Confirmations mots de passe non identiques | Vitest |
| Integration | Soumission patient → appel API correct | React Testing Library + MSW |
| Integration | Erreur API → message d'erreur affiché | React Testing Library + MSW |
| E2E | Remplir formulaire patient → inscription réussie | Playwright |
| E2E | Changer d'onglet → formulaire médecin chargé | Playwright |
| E2E | Soumettre INPE invalide → erreur inline | Playwright |

---

## 7. Justifications techniques

| Choix | Justification |
|-------|---------------|
| React Hook Form | Performances (uncontrolled inputs), intégration native avec Zod via resolver |
| Zod | Validation déclarative typée, inférence TypeScript automatique (`z.infer<>`) |
| Schémas séparés | Réutilisables dans les tests unitaires sans monter de composant |
| Deux onglets, un seul composant page | UX simple, pas de routing supplémentaire pour une page de formulaire |
| `apiFetch` centralisé | Gestion uniforme de l'enveloppe `ApiResponse<T>` et des erreurs HTTP |
| Validation double couche | Defense-in-depth : UX client + sécurité serveur |

---

## 8. Preuves d'exécution

```bash
# Test inscription patient
curl -X POST http://localhost:8080/api/v1/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Sarah","lastName":"Amrani","email":"sarah@test.com","phone":"0612345678","password":"Password123","confirmPassword":"Password123"}'
# {"success":true,"data":{"message":"Inscription réussie"},"message":null}

# Test inscription médecin
curl -X POST http://localhost:8080/api/v1/auth/register/medecin \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Karim","lastName":"Benali","email":"karim@test.com","phone":"0712345678","password":"Password123","confirmPassword":"Password123","inpe":"1234567890","specialite":"Cardiologie","ville":"Alger","adresse":"10 Rue Didouche Mourad"}'
# {"success":true,"data":{"message":"Inscription réussie"},"message":null}
```

**Screenshots** :
- `docs/screenshots/f03-inscription-patient.png` — formulaire patient
- `docs/screenshots/f03-inscription-medecin.png` — formulaire médecin (champs INPE visibles)
- `docs/screenshots/f03-erreur-validation.png` — erreurs Zod affichées inline
