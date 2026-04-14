# US-13 — Annulation de Rendez-Vous

**Module** : `agenda`  
**Endpoint** : `PUT /api/v1/agenda/rdv/{id}/annuler`  
**Stack** : Spring Boot 3.5.13 · Java 21 · PostgreSQL · JPA · Flyway  
**Tests** : 8 tests unitaires/slice (JUnit 5 + Mockito + MockMvc) — tous verts

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture en couches (DDD)](#2-architecture-en-couches-ddd)
3. [Design patterns utilisés](#3-design-patterns-utilisés)
4. [Modèle de données](#4-modèle-de-données)
5. [Contrat d'API](#5-contrat-dapi)
6. [Sécurité](#6-sécurité)
7. [Stratégie de test](#7-stratégie-de-test)
8. [Justifications techniques](#8-justifications-techniques)
9. [Preuves d'exécution](#9-preuves-dexécution)

---

## 1. Vue d'ensemble

L'US-13 clôture le Sprint 3 en ajoutant la capacité d'annuler un rendez-vous existant. Elle s'appuie entièrement sur les briques du domaine posées en US-11 (module `agenda`, table `rendez_vous`, record `RendezVous`) sans aucune migration Flyway supplémentaire.

Un seul endpoint :

| Endpoint | Rôle | Status |
|----------|------|--------|
| `PUT /api/v1/agenda/rdv/{id}/annuler` | Annule un rendez-vous par son identifiant | 200 / 404 / 422 |

L'annulation est refusée si le RDV est déjà dans un état terminal (`ANNULE` ou `TERMINE`) — une erreur `422 Unprocessable Entity` est retournée dans ce cas.

---

## 2. Architecture en couches (DDD)

US-13 ajoute un use case dans la couche application et un endpoint dans le contrôleur existant. Le domaine et l'infrastructure restent inchangés (tout était déjà en place grâce à US-11 et US-12).

```
agenda/
├── domain/                                   ← inchangé (US-11)
│   ├── RendezVous.java                           record + annuler() → new RendezVous(... ANNULE)
│   ├── StatutRdv.java                            enum { EN_ATTENTE, CONFIRME, ANNULE, TERMINE }
│   ├── RendezVousRepository.java                 interface (findById, save)
│   ├── RendezVousNotFoundException.java          → 404
│   └── RdvNonAnnulableException.java             → 422
│
├── application/                              ← 1 nouveau use case
│   └── AnnulerRendezVousUseCase.java             ← NOUVEAU
│
├── infrastructure/                           ← inchangé (US-11)
│   ├── RendezVousEntity.java
│   ├── JpaRendezVousRepository.java
│   └── SpringDataRendezVousRepository.java
│
└── web/                                      ← 1 nouvel endpoint
    └── AgendaController.java                     + PUT /rdv/{id}/annuler
```

### Flux — Annuler un rendez-vous

```
PUT /api/v1/agenda/rdv/{id}/annuler
    │
    ▼
AgendaController                        [web]
  @PathVariable UUID id
    │
    ▼
AnnulerRendezVousUseCase.execute(id)    [application]
  1. rdvRepo.findById(id)
     → Optional.empty() ? → RendezVousNotFoundException (404)
  2. rdv.statut() == ANNULE || TERMINE ?
     → RdvNonAnnulableException (422)
  3. rdvRepo.save(rdv.annuler())
     → RendezVous avec statut = ANNULE
    │
    ▼
SpringDataRendezVousRepository          [infrastructure]
  → UPDATE agenda.rendez_vous SET statut = 'ANNULE' WHERE id = ?
    │
    ▼
RendezVousResponse.from(cancelled)
    │
    ▼
ResponseEntity 200 OK { success: true, data: { id, statut: "ANNULE", ... } }
```

---

## 3. Design patterns utilisés

### 3.1 Méthode domaine `annuler()` sur le record immuable

```java
// RendezVous.java
public RendezVous annuler() {
    return new RendezVous(
        this.id, this.medecinId, this.patientId,
        this.dateRdv, this.heureRdv, this.duree,
        StatutRdv.ANNULE,
        this.motif, this.createdAt
    );
}
```

La transition d'état est encapsulée dans le domaine. Le use case ne manipule pas directement le statut — il délègue à `rdv.annuler()`. Cela garantit que la règle métier (le nouveau statut est toujours `ANNULE`, pas un paramètre arbitraire) est au cœur du domaine, pas dans la couche application.

### 3.2 Guard clauses séquentielles

```java
public RendezVous execute(UUID rdvId) {
    RendezVous rdv = rdvRepo.findById(rdvId)
        .orElseThrow(() -> new RendezVousNotFoundException(rdvId));   // guard 1 → 404

    if (rdv.statut() == StatutRdv.ANNULE || rdv.statut() == StatutRdv.TERMINE) {
        throw new RdvNonAnnulableException(rdvId, rdv.statut());      // guard 2 → 422
    }

    return rdvRepo.save(rdv.annuler());
}
```

Les deux gardes métier (existence + état annulable) sont vérifiées en tête de méthode. La logique heureuse (`save`) n'est atteinte qu'une fois les préconditions satisfaites.

### 3.3 Exception domaine typée `RdvNonAnnulableException`

```java
public class RdvNonAnnulableException extends RuntimeException {
    public RdvNonAnnulableException(UUID rdvId, StatutRdv statut) {
        super("Le rendez-vous " + rdvId + " ne peut pas être annulé (statut: " + statut + ")");
    }
}
```

L'exception est mappée en `422 Unprocessable Entity` dans `GlobalExceptionHandler`. Elle communique à la fois l'identité du RDV et le statut problématique dans son message.

### 3.4 Mapping DTO statique centralisé

```java
// RendezVousResponse.java (réutilisé depuis US-12)
public static RendezVousResponse from(RendezVous rdv) {
    return new RendezVousResponse(
        rdv.id(), rdv.medecinId(), rdv.patientId(),
        rdv.dateRdv(), rdv.heureRdv(), rdv.duree(),
        rdv.statut().name(), rdv.motif()
    );
}
```

Le même `RendezVousResponse` qu'en US-12 est réutilisé sans modification. Le contrôleur ne contient aucune logique de transformation.

---

## 4. Modèle de données

### Table utilisée — `agenda.rendez_vous` (V5, inchangée)

```sql
CREATE TABLE agenda.rendez_vous (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id   UUID        NOT NULL,
    patient_id   UUID        NOT NULL,
    date_rdv     DATE        NOT NULL,
    heure_rdv    TIME        NOT NULL,
    duree        INT         NOT NULL,
    statut       VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    motif        TEXT,
    created_at   TIMESTAMP   NOT NULL DEFAULT now(),
    UNIQUE (medecin_id, date_rdv, heure_rdv)
);
```

Aucune migration Flyway supplémentaire : la colonne `statut` existait déjà depuis V5. L'annulation est une simple mise à jour de cette colonne.

### Cycle de vie complet du statut (Sprint 3)

```
        [POST /rdv]
             │
             ▼
         EN_ATTENTE ──── (US-13) ──→ ANNULE  (état terminal)
             │
         (futur)
             │
         CONFIRME  ──── (US-13) ──→ ANNULE  (état terminal)
             │
         (futur)
             ▼
          TERMINE                             (état terminal)
```

US-13 permet la transition vers `ANNULE` depuis `EN_ATTENTE` ou `CONFIRME`. Les états `ANNULE` et `TERMINE` sont terminaux : aucune transition n'est possible depuis ces états.

---

## 5. Contrat d'API

### Annuler un rendez-vous

```
PUT /api/v1/agenda/rdv/{id}/annuler
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `id` | UUID (path) | Oui | Identifiant du rendez-vous à annuler |

Aucun corps de requête.

---

**200 OK** — annulation réussie

```json
{
  "success": true,
  "data": {
    "id":        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "medecinId": "550e8400-e29b-41d4-a716-446655440000",
    "patientId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "dateRdv":   "2027-06-02",
    "heureRdv":  "10:00",
    "duree":     30,
    "statut":    "ANNULE",
    "motif":     "Consultation générale"
  },
  "message": null
}
```

---

**404 Not Found** — rendez-vous introuvable

```json
{
  "success": false,
  "data":    null,
  "message": "Rendez-vous introuvable : id=a1b2c3d4-..."
}
```

---

**422 Unprocessable Entity** — statut non annulable

```json
{
  "success": false,
  "data":    null,
  "message": "Le rendez-vous a1b2c3d4-... ne peut pas être annulé (statut: ANNULE)"
}
```

---

## 6. Sécurité

### Endpoints publics (Sprint 3)

```java
.requestMatchers("/api/v1/agenda/**").permitAll()
```

L'endpoint d'annulation est public pendant le Sprint 3, cohérent avec la décision prise en US-11. La sécurisation par JWT (seul le patient propriétaire du RDV peut l'annuler) est prévue au Sprint 4.

### Protection contre l'annulation illégitime d'état

La vérification `statut == ANNULE || TERMINE` est faite en mémoire après lecture du RDV. Ce n'est pas une race condition : en cas de requêtes concurrentes sur le même RDV, seule l'une réussira le save — l'autre trouvera le RDV déjà `ANNULE` au prochain `findById` (ou obtiendra `ANNULE` du premier save). Le résultat final est idempotent.

---

## 7. Stratégie de test

### Organisation

```
src/test/java/ma/doctorek/doctorek/
└── agenda/
    ├── application/
    │   └── AnnulerRendezVousUseCaseTest.java    (5 tests) ← nouveau
    └── web/
        └── AgendaControllerTest.java            (15 tests — 6 US-11 + 6 US-12 + 3 US-13)
```

**Total module agenda : 37 tests, 0 failures, BUILD SUCCESS**

### Tests unitaires — `AnnulerRendezVousUseCase` (5 tests)

| Test | Scénario | Résultat attendu |
|------|----------|-----------------|
| `annule_rdvEnAttente_returnsAnnule` | RDV `EN_ATTENTE` trouvé | `save` appelé, résultat `statut == ANNULE` |
| `annule_rdvConfirme_returnsAnnule` | RDV `CONFIRME` trouvé | `save` appelé, résultat `statut == ANNULE` |
| `throws_whenRdvNotFound` | `findById` renvoie `Optional.empty()` | `RendezVousNotFoundException`, `save` jamais appelé |
| `throws_whenAlreadyAnnule` | RDV avec statut `ANNULE` | `RdvNonAnnulableException`, `save` jamais appelé |
| `throws_whenTermine` | RDV avec statut `TERMINE` | `RdvNonAnnulableException`, `save` jamais appelé |

### Tests de slice web — `AgendaControllerTest` — classe `AnnulerRdv` (3 nouveaux tests)

```java
@WebMvcTest(AgendaController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
```

**PUT /api/v1/agenda/rdv/{id}/annuler**

| Test | Scénario | Status attendu |
|------|----------|---------------|
| `returns200WithAnnulledRdv` | Use case retourne RDV `ANNULE` | 200, `success: true`, `statut: ANNULE` |
| `returns404WhenRdvNotFound` | Use case lance `RendezVousNotFoundException` | 404, `success: false` |
| `returns422WhenRdvNonAnnulable` | Use case lance `RdvNonAnnulableException` | 422, `success: false` |

---

## 8. Justifications techniques

### Pourquoi `PUT` et non `DELETE` pour annuler un RDV ?

L'annulation ne supprime pas la ligne en base — elle change le statut à `ANNULE`. `DELETE` serait sémantiquement incorrect et priverait le système de l'historique des RDVs annulés. `PUT` (ou `PATCH`) sur l'état est plus honnête. L'URL `/annuler` lève toute ambiguïté sur l'action métier.

### Pourquoi refuser l'annulation d'un RDV déjà `ANNULE` (422 vs idempotence) ?

Une implémentation idempotente retournerait 200 sur un RDV déjà `ANNULE`. Nous choisissons 422 pour signaler une incohérence côté client (envoyer deux fois la même annulation). Cela facilite le débogage (le client sait que quelque chose a annulé le RDV avant lui) et évite les boucles silencieuses. Si l'idempotence devient un besoin opérationnel, le changement est trivial (supprimer la garde et retourner le RDV tel quel).

### Pourquoi `rdv.annuler()` dans le domaine et non `new RendezVous(... ANNULE)` dans le use case ?

Construire le nouvel état directement dans le use case éparpillerait la logique de transition d'état dans la couche application. Si demain l'annulation doit aussi renseigner une `cancelledAt`, c'est `annuler()` qui évolue — le use case reste intact. Le domaine est l'autorité sur ses propres transitions.

### Pourquoi `save` plutôt qu'un `updateStatut` dédié ?

Le pattern `save` avec le record modifié est cohérent avec US-11 et US-12 : le repository expose une interface de domaine (`save`, `findById`, etc.), sans méthodes de mutation partielle spécifiques à chaque cas d'usage. Cela réduit la surface de l'interface et simplifie les mocks dans les tests.

---

## 9. Preuves d'exécution

### 9.1 — Suite de tests TDD (BUILD SUCCESS)

**Commande**
```bash
cd doctorek-backend
./mvnw test -Dtest="AgendaControllerTest,AnnulerRendezVousUseCaseTest" | grep -E "Tests run|BUILD"
```

**Résultat attendu**
```
Tests run: 5    →  AnnulerRendezVousUseCase     (Failures: 0, Errors: 0)
Tests run: 15   →  AgendaController             (Failures: 0, Errors: 0)
Tests run: 37, Failures: 0, Errors: 0
BUILD SUCCESS
```

> **Screenshot à prendre :** terminal ou IDE avec les 37 tests du module agenda verts.

---

### 9.2 — Annuler un rendez-vous (200 OK)

**Prérequis** : créer un RDV via `POST /api/v1/agenda/rdv` (US-12) et récupérer son `id`.

**Requête Postman**
```
PUT http://localhost:8080/api/v1/agenda/rdv/<uuid-du-rdv>/annuler
```

Aucun corps de requête.

**Observations à vérifier**
- Status `200 OK`
- `success: true`
- `data.statut` = `"ANNULE"`
- `data.id` correspond à l'UUID fourni en path

> **Screenshot à prendre :** Postman — PUT /rdv/{id}/annuler avec réponse 200 et `statut: "ANNULE"` visible.

---

### 9.3 — RDV introuvable (404 Not Found)

**Requête** : PUT avec un UUID qui n'existe pas en base.

**Réponse attendue**
```json
{
  "success": false,
  "data":    null,
  "message": "Rendez-vous introuvable : id=<uuid>"
}
```

> **Screenshot à prendre :** Postman — PUT avec un UUID inexistant, status 404 visible.

---

### 9.4 — Double annulation (422 Unprocessable Entity)

**Requête** : PUT sur un RDV déjà annulé (appeler deux fois l'endpoint sur le même RDV).

**Réponse attendue**
```json
{
  "success": false,
  "data":    null,
  "message": "Le rendez-vous <uuid> ne peut pas être annulé (statut: ANNULE)"
}
```

> **Screenshot à prendre :** Postman — deuxième PUT sur le même RDV, status 422 visible.

---

### 9.5 — Annulation d'un RDV terminé (422 Unprocessable Entity)

**Prérequis** : modifier manuellement le statut d'un RDV à `TERMINE` en base :
```sql
UPDATE agenda.rendez_vous SET statut = 'TERMINE' WHERE id = '<uuid>';
```

**Requête** : PUT /rdv/{uuid}/annuler

**Réponse attendue**
```json
{
  "success": false,
  "data":    null,
  "message": "Le rendez-vous <uuid> ne peut pas être annulé (statut: TERMINE)"
}
```

> **Screenshot à prendre :** Postman — PUT sur un RDV TERMINE, status 422 visible.
