# US-F01 — Page d'accueil (Redirect)

**Module** : `frontend / routing`  
**Route** : `/` → redirect vers `/recherche`  
**Stack** : Next.js 16 (App Router) · React 19 · TypeScript  
**Statut** : Livré — Sprint 2 Frontend MVP

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture en couches (Frontend)](#2-architecture-en-couches-frontend)
3. [Design patterns utilisés](#3-design-patterns-utilisés)
4. [Implémentation](#4-implémentation)
5. [Stratégie de test](#5-stratégie-de-test)
6. [Justifications techniques](#6-justifications-techniques)
7. [Preuves d'exécution](#7-preuves-dexécution)

---

## 1. Vue d'ensemble

La page d'accueil (`/`) est le point d'entrée de l'application. Elle ne rend aucun contenu visuel : elle effectue immédiatement une **redirection serveur** vers `/recherche`, qui constitue la page principale du MVP.

Ce choix est intentionnel :
- Le module de recherche est la fonctionnalité centrale du MVP Sprint 2
- La redirection est exécutée **côté serveur** (avant envoi HTML), évitant tout flash de contenu
- L'URL `/recherche` est directement bookmarkable et partageable

Flux :

```
Navigateur → GET /
             ↓
         Next.js Server Component
             ↓
         redirect('/recherche')   [HTTP 307 côté serveur]
             ↓
         GET /recherche
```

---

## 2. Architecture en couches (Frontend)

```
app/
└── page.tsx          ← Server Component — redirect uniquement
```

Aucune couche feature, hook ou API n'est impliquée. Il s'agit du plus simple des Server Components Next.js.

---

## 3. Design patterns utilisés

### Server Component (Next.js App Router)

`app/page.tsx` est un **React Server Component** (RSC) par défaut dans l'App Router. Il s'exécute exclusivement sur le serveur, sans JavaScript client. La fonction `redirect()` de Next.js émet un header HTTP `Location` et interrompt le rendu avant tout envoi de HTML.

```
Client                    Next.js Server
  |                            |
  |------ GET / ------------->|
  |                            |-- Server Component s'exécute
  |                            |-- redirect('/recherche') appelé
  |<----- 307 Location: /recherche --|
  |------ GET /recherche ----->|
  |<----- 200 HTML ------------|
```

### Redirect déclaratif

Utilisation de la fonction `redirect` importée de `next/navigation` plutôt qu'un `<meta http-equiv="refresh">` ou un `useRouter().push()` côté client — ce qui garantit la redirection sans JavaScript activé.

---

## 4. Implémentation

### `app/page.tsx`

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/recherche')
}
```

Fichier complet — 4 lignes. Aucune dépendance supplémentaire.

---

## 5. Stratégie de test

| Type | Description | Outil |
|------|-------------|-------|
| E2E | GET `/` retourne un redirect vers `/recherche` | Playwright |
| E2E | La page `/recherche` charge correctement après redirect | Playwright |

Test E2E minimal :

```typescript
test('page accueil redirige vers /recherche', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/recherche')
})
```

---

## 6. Justifications techniques

| Choix | Justification |
|-------|---------------|
| `redirect()` Next.js côté serveur | Évite le flash de contenu côté client, fonctionne sans JS |
| Pas de page landing | MVP orienté fonctionnalité — l'annuaire est la valeur principale |
| App Router | Standard Next.js 13+, Server Components par défaut, pas de `getServerSideProps` |

---

## 7. Preuves d'exécution

```bash
# Vérification du redirect HTTP
curl -I http://localhost:3000/
# HTTP/1.1 307 Temporary Redirect
# Location: /recherche
```

**Screenshot** : `docs/screenshots/f01-redirect.png` *(à générer en phase de livraison)*
