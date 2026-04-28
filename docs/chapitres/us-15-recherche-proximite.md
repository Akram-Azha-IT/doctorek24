# US-15 — Recherche de médecins à proximité (Backend)

**Module** : `backend / annuaire`  
**Endpoint** : `GET /api/v1/annuaire/medecins/nearby`  
**Stack** : Spring Boot 3 · Java 17 · PostgreSQL · JPA  
**Statut** : Livré — Sprint 9

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Migration base de données](#2-migration-base-de-données)
3. [Domaine et Use Case](#3-domaine-et-use-case)
4. [Contrat d'API](#4-contrat-dapi)
5. [Architecture en couches](#5-architecture-en-couches)
6. [Algorithme de distance](#6-algorithme-de-distance)
7. [Justifications techniques](#7-justifications-techniques)

---

## 1. Vue d'ensemble

Ajout des coordonnées géographiques (`latitude`, `longitude`) au profil médecin, et d'un endpoint de recherche par proximité retournant les médecins dans un rayon donné, triés par distance croissante.

---

## 2. Migration base de données

**Fichier** : `src/main/resources/db/migration/V10__add_geo_coordinates.sql`

```sql
ALTER TABLE medecin_profiles
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
```

Colonnes nullable — les médecins existants conservent leurs profils sans coordonnées.

---

## 3. Domaine et Use Case

### MedecinProfile (nouveaux champs)

```java
// annuaire/domain/MedecinProfile.java
private Double latitude;
private Double longitude;
```

### MedecinNearbyResult

```java
public record MedecinNearbyResult(
    MedecinProfile medecin,
    double distanceKm
) {}
```

### SearchNearbyMedecinsUseCase

```java
public List<MedecinNearbyResult> execute(double lat, double lng, double radiusKm) {
    return repository.findAll().stream()
        .filter(m -> m.getLatitude() != null && m.getLongitude() != null)
        .map(m -> new MedecinNearbyResult(m, haversine(lat, lng, m.getLatitude(), m.getLongitude())))
        .filter(r -> r.distanceKm() <= radiusKm)
        .sorted(Comparator.comparingDouble(MedecinNearbyResult::distanceKm))
        .toList();
}
```

---

## 4. Contrat d'API

### `GET /api/v1/annuaire/medecins/nearby`

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `lat` | `double` | Oui | — | Latitude du point de référence |
| `lng` | `double` | Oui | — | Longitude du point de référence |
| `radius` | `double` | Non | `10.0` | Rayon de recherche en kilomètres |

**Réponse 200 OK :**

```json
{
  "success": true,
  "data": [
    {
      "medecin": {
        "id": "uuid",
        "firstName": "Ahmed",
        "lastName": "Benali",
        "specialite": "Cardiologie",
        "ville": "Alger",
        "latitude": 36.7538,
        "longitude": 3.0588
      },
      "distanceKm": 1.23
    }
  ],
  "message": null
}
```

**Réponse 400 Bad Request** : paramètres `lat` ou `lng` manquants.

---

## 5. Architecture en couches

```
AnnuaireController
    └── GET /medecins/nearby?lat=&lng=&radius=
            │
            └── SearchNearbyMedecinsUseCase.execute(lat, lng, radius)
                        │
                        └── MedecinProfileRepository.findAll()
                                    │
                                    └── PostgreSQL — table medecin_profiles
```

### Fichiers modifiés / créés

| Fichier | Changement |
|---------|-----------|
| `V10__add_geo_coordinates.sql` | Migration Flyway — colonnes lat/lng |
| `MedecinProfile.java` | Champs `latitude`, `longitude` |
| `MedecinProfileRepository.java` | Interface — pas de nouveau contrat |
| `JpaMedecinProfileRepository.java` | Mapping JPA nouveaux champs |
| `MedecinNearbyResult.java` | Nouveau record résultat |
| `SearchNearbyMedecinsUseCase.java` | Nouveau use case |
| `AnnuaireController.java` | Nouveau endpoint `/nearby` |

---

## 6. Algorithme de distance

Formule de Haversine — distance orthodromique sur sphère.

```java
private static double haversine(double lat1, double lng1, double lat2, double lng2) {
    final double R = 6371.0; // rayon Terre en km
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
             + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
             * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
```

Précision suffisante pour des distances médicales (< 50 km). Erreur max ~0.3% vs distance réelle.

---

## 7. Justifications techniques

| Choix | Justification |
|-------|---------------|
| Haversine en Java (pas PostGIS) | Pas de dépendance extension PostgreSQL supplémentaire pour un MVP |
| `findAll()` + filter en mémoire | Nombre de médecins faible (MVP) — acceptable. À migrer vers requête SQL avec `ST_DWithin` si le volume croît |
| Colonnes nullable | Rétrocompatibilité — profils existants non cassés |
| `radius` défaut 10 km | Valeur usuelle pour recherche urbaine de médecin |
| `record MedecinNearbyResult` | Immuable, concis, Java 17 idiomatique |
