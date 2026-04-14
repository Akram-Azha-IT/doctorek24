# US-12 — Prise de Rendez-Vous Patient

**Module** : `agenda`  
**Endpoints** : `POST /api/v1/agenda/rdv` · `GET /api/v1/agenda/patients/{id}/rdv`  
**Stack** : Spring Boot 3.5.13 · Java 21 · PostgreSQL · JPA · Flyway  
**Tests** : 29 tests unitaires/slice (JUnit 5 + Mockito + MockMvc) — tous verts

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

L'US-12 étend le module `agenda` (introduit en US-11) pour permettre à un patient de réserver un créneau chez un médecin. Le système vérifie l'existence d'un agenda pour le jour demandé et l'absence de conflit de réservation avant de persister le rendez-vous.

Deux nouveaux endpoints :

| Endpoint | Rôle | Status |
|----------|------|--------|
| `POST /api/v1/agenda/rdv` | Prendre un rendez-vous (patient → médecin) | 201 / 404 / 409 / 400 |
| `GET /api/v1/agenda/patients/{patientId}/rdv` | Lister tous les RDV d'un patient | 200 |

La table `agenda.rendez_vous` (créée en US-11 via la migration V5) est réutilisée sans nouvelle migration.

---

## 2. Architecture en couches (DDD)

US-12 ajoute deux use cases dans la couche application et deux endpoints dans le contrôleur existant, sans toucher au domaine ni à l'infrastructure (tout était déjà en place grâce à US-11).

```
agenda/
├── domain/                                   ← inchangé (US-11)
│   ├── RendezVous.java                           record (id, medecinId, patientId, date, heure, duree, statut, motif, createdAt)
│   ├── StatutRdv.java                            enum { EN_ATTENTE, CONFIRME, ANNULE, TERMINE }
│   ├── RendezVousRepository.java                 interface (existsByMedecinIdAndDateAndHeure, save, findByPatientId)
│   ├── MedecinSansAgendaException.java           → 404
│   └── CreneauIndisponibleException.java         → 409
│
├── application/                              ← 2 nouveaux use cases
│   ├── PrendreRdvUseCase.java                    ← NOUVEAU
│   ├── GetRdvsPatientUseCase.java                ← NOUVEAU
│   └── dto/
│       ├── PrendreRdvRequest.java                ← NOUVEAU
│       └── RendezVousResponse.java               ← NOUVEAU
│
├── infrastructure/                           ← inchangé (US-11)
│   ├── RendezVousEntity.java
│   ├── JpaRendezVousRepository.java
│   └── SpringDataRendezVousRepository.java
│
└── web/                                      ← 2 nouveaux endpoints
    └── AgendaController.java                     + POST /rdv, + GET /patients/{id}/rdv
```

### Flux — Prendre un rendez-vous

```
POST /api/v1/agenda/rdv
    │
    ▼
AgendaController                        [web]
  @Valid @RequestBody PrendreRdvRequest
    │
    ▼
PrendreRdvUseCase.execute(request)      [application]
  1. dispoRepo.findByMedecinIdAndJour(medecinId, dateRdv.getDayOfWeek())
     → Optional.empty() ? → MedecinSansAgendaException (404)
  2. rdvRepo.existsByMedecinIdAndDateAndHeure(medecinId, dateRdv, heureRdv)
     → true ? → CreneauIndisponibleException (409)
  3. rdvRepo.save(new RendezVous(null, medecinId, patientId, dateRdv, heureRdv,
                                 dispo.dureeConsultation(), EN_ATTENTE, motif, now()))
    │
    ▼
SpringDataRendezVousRepository          [infrastructure]
  → INSERT INTO agenda.rendez_vous
    │
    ▼
RendezVousResponse.from(saved)
    │
    ▼
ResponseEntity 201 Created { success: true, data: { id, statut: "EN_ATTENTE", ... } }
```

### Flux — Lister les RDVs d'un patient

```
GET /api/v1/agenda/patients/{patientId}/rdv
    │
    ▼
AgendaController                        [web]
  @PathVariable UUID patientId
    │
    ▼
GetRdvsPatientUseCase.execute(patientId) [application]
  rdvRepo.findByPatientId(patientId)
    │
    ▼
ResponseEntity 200 OK { success: true, data: [ { id, medecinId, dateRdv, statut, ... }, ... ] }
```

---

## 3. Design patterns utilisés

### 3.1 Guard clauses séquentielles

```java
public RendezVous execute(PrendreRdvRequest request) {
    Disponibilite dispo = dispoRepo
        .findByMedecinIdAndJour(request.medecinId(), request.dateRdv().getDayOfWeek())
        .orElseThrow(() -> new MedecinSansAgendaException(request.medecinId()));  // guard 1

    if (rdvRepo.existsByMedecinIdAndDateAndHeure(
            request.medecinId(), request.dateRdv(), request.heureRdv())) {
        throw new CreneauIndisponibleException(                                    // guard 2
            "Créneau indisponible : " + request.dateRdv() + " à " + request.heureRdv());
    }

    return rdvRepo.save(new RendezVous(...));
}
```

Les pré-conditions métier sont vérifiées en tête de méthode via des early returns / throw. La logique heureuse de sauvegarde n'est atteinte qu'une fois toutes les gardes passées.

### 3.2 RendezVous immuable avec statut initial

```java
RendezVous rdv = new RendezVous(
    null,                          // id généré en base
    request.medecinId(),
    request.patientId(),
    request.dateRdv(),
    request.heureRdv(),
    dispo.dureeConsultation(),     // hérité de la disponibilité du médecin
    StatutRdv.EN_ATTENTE,          // statut initial imposé par le domaine
    request.motif(),
    LocalDateTime.now()
);
```

Le statut `EN_ATTENTE` est imposé par le use case — le client n'a pas le choix du statut initial. La durée est également héritée de la disponibilité du médecin, pas fournie par le client.

### 3.3 Mapping DTO statique

```java
public record RendezVousResponse(
    UUID id, UUID medecinId, UUID patientId,
    LocalDate dateRdv, LocalTime heureRdv, int duree, String statut, String motif
) {
    public static RendezVousResponse from(RendezVous rdv) {
        return new RendezVousResponse(
            rdv.id(), rdv.medecinId(), rdv.patientId(),
            rdv.dateRdv(), rdv.heureRdv(), rdv.duree(),
            rdv.statut().name(), rdv.motif()
        );
    }
}
```

Le mapping est centralisé dans une méthode `static from()` du record DTO. Le contrôleur ne contient aucune logique de transformation.

### 3.4 Contrainte d'unicité base comme filet de sécurité

La contrainte `UNIQUE (medecin_id, date_rdv, heure_rdv)` (créée en V5) garantit qu'aucun doublon ne peut être inséré même en cas de race condition concurrente. Le check applicatif `existsBy...` est une précondition lisible ; la contrainte base est le verrou réel.

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

Aucune migration Flyway supplémentaire n'est nécessaire pour US-12 : le schéma était déjà complet depuis US-11.

### Cycle de vie du statut

```
        [POST /rdv]
             │
             ▼
         EN_ATTENTE
        /           \
   (US-13)        (futur)
  ANNULE          CONFIRME
                      │
                  (futur)
                  TERMINE
```

US-12 ne crée que des RDVs en statut `EN_ATTENTE`. Les transitions vers `ANNULE` (US-13), `CONFIRME`, et `TERMINE` sont hors scope de cette US.

---

## 5. Contrat d'API

### 5.1 — Prendre un rendez-vous

```
POST /api/v1/agenda/rdv
Content-Type: application/json
```

**Corps de la requête**
```json
{
  "medecinId":  "550e8400-e29b-41d4-a716-446655440000",
  "patientId":  "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "dateRdv":    "2027-06-02",
  "heureRdv":   "10:00:00",
  "motif":      "Consultation générale"
}
```

| Champ | Type | Requis | Validation |
|-------|------|--------|-----------|
| `medecinId` | UUID | Oui | @NotNull |
| `patientId` | UUID | Oui | @NotNull |
| `dateRdv` | LocalDate (`YYYY-MM-DD`) | Oui | @NotNull |
| `heureRdv` | LocalTime (`HH:mm:ss`) | Oui | @NotNull |
| `motif` | String | Non | — |

**201 Created**
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
    "statut":    "EN_ATTENTE",
    "motif":     "Consultation générale"
  },
  "message": null
}
```

**409 Conflict** — créneau déjà réservé
```json
{
  "success": false,
  "data":    null,
  "message": "Créneau indisponible : 2027-06-02 à 10:00"
}
```

**404 Not Found** — le médecin n'a pas d'agenda ce jour
```json
{
  "success": false,
  "data":    null,
  "message": "Aucun agenda défini pour le médecin : id=550e8400-..."
}
```

**400 Bad Request** — champ obligatoire manquant
```json
{
  "success": false,
  "data":    null,
  "message": "medecinId must not be null"
}
```

---

### 5.2 — Lister les rendez-vous d'un patient

```
GET /api/v1/agenda/patients/{patientId}/rdv
```

**200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id":        "a1b2c3d4-...",
      "medecinId": "550e8400-...",
      "patientId": "6ba7b810-...",
      "dateRdv":   "2027-06-02",
      "heureRdv":  "10:00",
      "duree":     30,
      "statut":    "EN_ATTENTE",
      "motif":     "Consultation générale"
    }
  ],
  "message": null
}
```

**200 OK — aucun rendez-vous**
```json
{ "success": true, "data": [], "message": null }
```

---

## 6. Sécurité

### Endpoints publics (Sprint 3)

```java
.requestMatchers("/api/v1/agenda/**").permitAll()
```

Les endpoints RDV sont publics pendant le Sprint 3, cohérent avec la décision prise en US-11. La sécurisation par JWT (authentification du patient requise pour prendre un RDV) est prévue au Sprint 4.

### Isolation des modules

Le module `agenda` reçoit `medecinId` et `patientId` comme paramètres opaques et ne valide pas l'existence des utilisateurs dans le module `auth`. Cette validation transversale sera renforcée au Sprint 4.

### Protection contre les doubles réservations

La contrainte `UNIQUE (medecin_id, date_rdv, heure_rdv)` en base garantit l'unicité même sous requêtes concurrentes. Le check `existsByMedecinIdAndDateAndHeure` avant le save est une précondition lisible, pas la seule ligne de défense.

---

## 7. Stratégie de test

### Organisation

```
src/test/java/ma/doctorek/doctorek/
└── agenda/
    ├── application/
    │   ├── PrendreRdvUseCaseTest.java        (5 tests) ← nouveau
    │   └── GetRdvsPatientUseCaseTest.java    (3 tests) ← nouveau
    └── web/
        └── AgendaControllerTest.java         (12 tests — 6 US-11 + 6 US-12)
```

**Total module agenda : 29 tests, 0 failures, BUILD SUCCESS**

### Tests unitaires — `PrendreRdvUseCase` (5 tests)

| Test | Scénario | Résultat attendu |
|------|----------|-----------------|
| `execute_happyPath_returnsRdv` | Disponibilité trouvée, créneau libre | RDV créé, statut `EN_ATTENTE` |
| `execute_dureeDuRdvFromDispo` | Disponibilité avec `dureeConsultation = 20` | `rdv.duree() == 20` |
| `execute_noDisponibilite_throws` | `findByMedecinIdAndJour` renvoie `Optional.empty()` | `MedecinSansAgendaException` |
| `execute_creneauOccupe_throws` | `existsBy...` renvoie `true` | `CreneauIndisponibleException` |
| `execute_savesWithNullId` | Appel `save` avec `rdv.id() == null` | UUID généré en base |

### Tests unitaires — `GetRdvsPatientUseCase` (3 tests)

| Test | Scénario | Résultat attendu |
|------|----------|-----------------|
| `execute_returnsRdvsForPatient` | 2 RDVs en base pour ce patient | Liste de 2 éléments |
| `execute_noRdv_returnsEmptyList` | Aucun RDV pour ce patient | `List.of()` |
| `execute_delegatesToRepository` | Vérification de l'appel délégué | `findByPatientId(patientId)` appelé une fois |

### Tests de slice web — `AgendaControllerTest` (6 nouveaux tests)

```java
@WebMvcTest(AgendaController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
```

**POST /api/v1/agenda/rdv**

| Test | Scénario | Status attendu |
|------|----------|---------------|
| `returns201WithRendezVous` | Requête valide, use case retourne un RDV | 201, `success: true`, `statut: EN_ATTENTE` |
| `returns409WhenCreneauIndisponible` | Use case lance `CreneauIndisponibleException` | 409, `success: false` |
| `returns404WhenNoAgenda` | Use case lance `MedecinSansAgendaException` | 404, `success: false` |
| `returns400WhenMedecinIdMissing` | Body sans `medecinId` | 400, `success: false` |

**GET /api/v1/agenda/patients/{patientId}/rdv**

| Test | Scénario | Status attendu |
|------|----------|---------------|
| `returns200WithList` | Use case retourne 1 RDV | 200, tableau avec `id` et `statut` corrects |
| `returns200WithEmptyList` | Use case retourne liste vide | 200, `data: []` |

---

## 8. Justifications techniques

### Pourquoi la durée du RDV est-elle héritée de la disponibilité, pas fournie par le client ?

La durée d'une consultation est définie par le médecin (via `DefineDisponibiliteUseCase`). Si le client pouvait imposer une durée arbitraire, un patient pourrait bloquer un créneau de 2h sur un agenda prévu pour des consultations de 15 min, ou inversement créer des créneaux qui ne s'alignent pas avec la grille du médecin.

### Pourquoi le statut initial est-il imposé à `EN_ATTENTE` par le use case ?

Le statut est une décision métier, pas une entrée client. Permettre au client de spécifier `statut: "CONFIRME"` dans le body ouvrirait une faille (un patient se confirmerait lui-même). Le use case est le seul décideur du statut initial.

### Pourquoi `PrendreRdvRequest` ne contient-il pas `duree` ni `statut` ?

Ces deux champs sont calculés ou imposés par le domaine (cf. points ci-dessus). Les exposer dans le DTO d'entrée créerait une surface d'attaque inutile et une confusion sur qui a autorité sur ces valeurs.

### Pourquoi le check `existsBy...` précède-t-il le `save` ?

Lever `CreneauIndisponibleException` avant le `save` donne un message d'erreur clair (409) au client. Sans ce check, la contrainte `UNIQUE` en base lèverait une `DataIntegrityViolationException` générique de JPA — difficile à mapper proprement en 409 sans code de gestion d'erreur supplémentaire.

---

## 9. Preuves d'exécution

### 9.1 — Suite de tests TDD (BUILD SUCCESS)

**Commande**
```bash
cd doctorek-backend
./mvnw test -Dtest="AgendaControllerTest,PrendreRdvUseCaseTest,GetRdvsPatientUseCaseTest" | grep -E "Tests run|BUILD"
```

**Résultat attendu**
```
Tests run: 3    →  GetRdvsPatientUseCase     (Failures: 0, Errors: 0)
Tests run: 5    →  PrendreRdvUseCase         (Failures: 0, Errors: 0)
Tests run: 12   →  AgendaController          (Failures: 0, Errors: 0)
Tests run: 29, Failures: 0, Errors: 0
BUILD SUCCESS
```

> **Screenshot à prendre :** terminal ou IDE avec les 29 tests verts.

---

### 9.2 — Prendre un rendez-vous (201 Created)

**Requête Postman**
```
POST http://localhost:8080/api/v1/agenda/rdv
Content-Type: application/json

{
  "medecinId":  "<uuid-du-medecin>",
  "patientId":  "<uuid-du-patient>",
  "dateRdv":    "2027-06-02",
  "heureRdv":   "09:00:00",
  "motif":      "Consultation générale"
}
```

**Observations à vérifier**
- Status `201 Created`
- `success: true`
- `data.id` présent (UUID généré)
- `data.statut` = `"EN_ATTENTE"`
- `data.duree` = valeur héritée de la disponibilité du médecin

> **Screenshot à prendre :** Postman — POST /rdv avec réponse 201 visible.

---

### 9.3 — Double réservation (409 Conflict)

Même requête que 9.2, envoyée une deuxième fois.

**Réponse attendue**
```json
{
  "success": false,
  "data":    null,
  "message": "Créneau indisponible : 2027-06-02 à 09:00"
}
```

> **Screenshot à prendre :** Postman — deuxième POST avec status 409 visible.

---

### 9.4 — Médecin sans agenda ce jour (404 Not Found)

**Requête** : `dateRdv` sur un jour de la semaine sans disponibilité définie pour ce médecin.

**Réponse attendue**
```json
{
  "success": false,
  "data":    null,
  "message": "Aucun agenda défini pour le médecin : id=..."
}
```

> **Screenshot à prendre :** Postman — POST /rdv avec un jour sans agenda, status 404 visible.

---

### 9.5 — Lister les rendez-vous d'un patient (200 OK)

```
GET http://localhost:8080/api/v1/agenda/patients/<uuid-patient>/rdv
```

**Observations à vérifier**
- Status `200 OK`
- `data` est un tableau
- Chaque entrée contient `id`, `medecinId`, `dateRdv`, `heureRdv`, `duree`, `statut`, `motif`

> **Screenshot à prendre :** Postman — GET /patients/{id}/rdv avec au moins 1 RDV visible.

---

### 9.6 — Validation Bean (400 Bad Request)

**Requête** : body sans `medecinId`.

```json
{
  "patientId": "<uuid>",
  "dateRdv":   "2027-06-02",
  "heureRdv":  "10:00:00"
}
```

**Réponse attendue**
```json
{
  "success": false,
  "data":    null,
  "message": "medecinId must not be null"
}
```

> **Screenshot à prendre :** Postman — POST /rdv sans `medecinId`, status 400 visible.
