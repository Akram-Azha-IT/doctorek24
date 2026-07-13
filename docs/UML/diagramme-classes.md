# Diagramme de classes — Doctorek

Diagramme simplifié (modèle de données principal). Format Mermaid — renderable dans GitHub, VS Code (extension Mermaid), ou via Eraser.io (coller le code Mermaid dans un nouveau diagramme).

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String phone
        +String firstName
        +String lastName
        +Role role
        +boolean active
        +boolean emailVerified
    }

    class MedecinDetail {
        +UUID userId
        +String inpe
        +String specialite
        +String ville
        +String adresse
        +Double latitude
        +Double longitude
    }

    class PatientDetail {
        +UUID userId
        +LocalDate dateNaissance
        +String genre
        +String numIdentite
        +String adresseVille
    }

    class Disponibilite {
        +UUID id
        +UUID medecinId
        +String jourSemaine
        +LocalTime heureDebut
        +LocalTime heureFin
        +int dureeConsultation
        +String frequence
    }

    class RendezVous {
        +UUID id
        +UUID medecinId
        +UUID patientId
        +LocalDate dateRdv
        +LocalTime heureRdv
        +int duree
        +String statut
        +String motif
    }

    class Conversation {
        +UUID id
        +UUID medecinId
        +UUID patientId
        +Instant lastMessageAt
    }

    class Message {
        +UUID id
        +UUID conversationId
        +UUID senderId
        +String content
        +Instant sentAt
        +Instant readAt
    }

    class Ordonnance {
        +UUID id
        +UUID patientId
        +UUID medecinId
        +LocalDate dateEmission
        +String medicamentsJson
        +String fichierChemin
    }

    class InfosMedicales {
        +UUID patientId
        +String groupeSanguin
        +String allergiesJson
        +String antecedents
        +String traitementsCours
    }

    class CarteVirtuelle {
        +UUID id
        +UUID patientId
        +String cardRef
        +String statut
        +String groupeSanguin
        +String allergies
    }

    class DocumentMedical {
        +UUID id
        +UUID patientId
        +String nom
        +String typeDoc
        +String chemin
    }

    %% Relations
    User "1" -- "1" MedecinDetail : extends
    User "1" -- "1" PatientDetail : extends

    MedecinDetail "1" -- "0..*" Disponibilite : définit
    MedecinDetail "1" -- "0..*" RendezVous : reçoit
    PatientDetail "1" -- "0..*" RendezVous : prend

    MedecinDetail "1" -- "0..*" Conversation
    PatientDetail "1" -- "0..*" Conversation
    Conversation "1" -- "0..*" Message : contient

    PatientDetail "1" -- "0..*" Ordonnance : reçoit
    MedecinDetail "1" -- "0..*" Ordonnance : émet

    PatientDetail "1" -- "0..1" InfosMedicales
    PatientDetail "1" -- "0..1" CarteVirtuelle
    PatientDetail "1" -- "0..*" DocumentMedical
```

## Notes pour le rapport
- `User` = table commune (auth, rôles : PATIENT, MEDECIN, ADMIN).
- `MedecinDetail` / `PatientDetail` = extension 1-1 de `User` (héritage par table jointe).
- Champs JSON (`medicamentsJson`, `allergiesJson`, `questionnaireJson`) simplifiés en attribut unique pour lisibilité — détailler en annexe si besoin.
