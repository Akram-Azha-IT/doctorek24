# Changement : Réordonnancement des User Stories — Sprint 1

**Date :** 2026-04-07  
**Décision prise par :** Akram  
**Contexte :** Session de planification Sprint 1

---

## Problème identifié

L'ordre initial du Sprint 1 prévoyait d'enchaîner directement :

```
US-02 (Inscription patient) → US-03 (Inscription médecin) → US-04 (JWT Login) → US-05/06/07 (auth avancée)
```

**Inconvénient majeur :** Une fois US-04 (JWT) implémenté, chaque test d'endpoint nécessite un token Bearer valide. Cela alourdit le développement des User Stories suivantes (US-08, US-09, US-10) qui sont des fonctionnalités métier indépendantes de l'authentification.

---

## Décision

Adopter l'**Option A** : décaler le bloc authentification avancée (US-04 à US-07) après le module annuaire.

### Nouvel ordre

| Ordre | US | Titre | Points | Raison |
|-------|----|-------|--------|--------|
| 1 | US-01 | Setup Docker + Spring Boot | 3 | ✅ Fait |
| 2 | US-02 | Inscription patient | 5 | ✅ Fait |
| 3 | US-03 | Inscription médecin | 5 | Pas de JWT requis |
| **4** | **US-08** | **Profil public médecin** | **3** | **Endpoint public, pas de JWT** |
| **5** | **US-09** | **Recherche spécialité + ville** | **5** | **Endpoint public, pas de JWT** |
| 6 | US-04 | Connexion + JWT Access Token | 5 | Auth après le métier |
| 7 | US-05 | Refresh Token rotation | 3 | Bloc auth |
| 8 | US-06 | RBAC (PATIENT/MEDECIN/ADMIN) | 3 | Bloc auth |
| 9 | US-07 | Déconnexion + invalidation token | 2 | Bloc auth |
| 10 | US-10 | Complétion profil médecin | 3 | Nécessite auth (en dernier) |

---

## Justification technique

- **US-08** (profil public médecin) et **US-09** (recherche) sont des endpoints **publics** — pas besoin d'un `Authorization: Bearer` header pour les tester.
- On peut tester librement avec Postman/curl sans gérer de tokens.
- Quand le module annuaire est stable et testé, on implémente l'auth (US-04→07) en sachant exactement quels endpoints protéger.
- US-10 (complétion profil) requiert un médecin authentifié → naturellement placé après l'auth.

---

## Impact

- Aucun changement de périmètre Sprint 1 (toutes les US restent dans le sprint).
- Aucun changement de points (total : 39 pts).
- Uniquement l'ordre d'implémentation est modifié.
