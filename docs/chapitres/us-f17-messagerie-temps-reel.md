# US-F17 — Messagerie temps réel médecin ↔ patient

## Description

En tant que médecin ou patient connecté, je veux pouvoir envoyer et recevoir des messages en temps réel avec l'autre partie via la plateforme, afin de communiquer sans quitter Doctorek.

## Critères d'acceptation

- Une conversation persistante par paire médecin/patient (une seule, pas liée à un RDV)
- Messages reçus en temps réel via WebSocket (sans rechargement de page)
- Affichage immédiat du message envoyé (optimiste) avant confirmation serveur
- Fallback REST si WebSocket indisponible
- Indicateur lu/non-lu (✓ / ✓✓) sur chaque message
- Compteur de messages non lus dans la liste des conversations
- Marquage automatique comme lu à l'ouverture d'une conversation
- Lien "Messages" dans le header pour les utilisateurs connectés

---

## Architecture technique

### Transport : WebSocket + STOMP + SockJS

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Backend WebSocket | `spring-boot-starter-websocket` | Broker STOMP in-memory |
| Protocole | STOMP (Simple Text Oriented Messaging Protocol) | Routing messages |
| Fallback transport | SockJS | Compatibilité environnements sans WS natif |
| Auth WebSocket | JWT via STOMP CONNECT interceptor | Même token que les requêtes REST |
| Push frontend | `@stomp/stompjs` v7 | Client STOMP |
| Fallback frontend | REST POST via `apiFetch` | Si STOMP non connecté |

### Flux d'un message

```
Patient tape → useChat.sendMessage()
  ├── STOMP connecté → publish /app/chat.send → ChatController (backend)
  │     → MessagingService.sendMessage()
  │         → save message en DB
  │         → update lastMessageAt sur conversation
  │         → stompTemplate.convertAndSendToUser(recipientEmail, /queue/messages, MessageResponse)
  │               → médecin reçoit en temps réel via /user/queue/messages
  │
  └── STOMP non connecté → REST POST /api/v1/messaging/conversations/{convId}/messages
        → même logique service, mais pas de push temps réel
```

### Identité STOMP

Le principal STOMP = `preferred_username` (email), cohérent avec le principal REST géré par `JwtAuthConverter`. Le `ChannelInterceptor` sur le frame `CONNECT` extrait le claim `preferred_username` du JWT et le définit comme nom de principal.

---

## Base de données

### Schéma Flyway : `V22__create_messaging.sql`

```sql
CREATE SCHEMA IF NOT EXISTS messaging;

CREATE TABLE messaging.conversation (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id      UUID NOT NULL REFERENCES auth.users(id),
    patient_id      UUID NOT NULL REFERENCES auth.users(id),
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_pair UNIQUE (medecin_id, patient_id)
);

CREATE TABLE messaging.message (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES messaging.conversation(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES auth.users(id),
    content         TEXT NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ
);
```

**Contrainte `uq_conversation_pair`** — garantit une seule conversation par paire médecin/patient. `startOrGet()` utilise `INSERT ... ON CONFLICT` via `findByMedecinIdAndPatientId` puis création si absente.

---

## Backend — Fichiers créés/modifiés

| Fichier | Type | Rôle |
|---------|------|------|
| `db/migration/V22__create_messaging.sql` | NEW | Schéma DB |
| `entity/ConversationEntity.java` | NEW | JPA entity `messaging.conversation` |
| `entity/MessageEntity.java` | NEW | JPA entity `messaging.message` |
| `repository/ConversationRepository.java` | NEW | JPA repository conversations |
| `repository/MessageRepository.java` | NEW | JPA repository messages + markRead bulk update |
| `repository/UserRepository.java` | MODIFIED | Ajout `findByKeycloakId` |
| `messaging/dto/SendMessageRequest.java` | NEW | Record — payload envoi message |
| `messaging/dto/MessageResponse.java` | NEW | Record — réponse message |
| `messaging/dto/ConversationResponse.java` | NEW | Record — réponse conversation (avec unreadCount) |
| `messaging/dto/StartConversationRequest.java` | NEW | Record — démarrer conversation |
| `messaging/MessagingService.java` | NEW | Logique métier + push STOMP |
| `messaging/WebSocketConfig.java` | NEW | Config STOMP + ChannelInterceptor JWT |
| `messaging/ChatController.java` | NEW | `@MessageMapping` /chat.send et /chat.read |
| `messaging/MessagingController.java` | NEW | REST CRUD conversations/messages |
| `security/SecurityConfig.java` | MODIFIED | Permit `/ws/**` + CORS WebSocket |
| `pom.xml` | MODIFIED | Ajout `spring-boot-starter-websocket` |

### Endpoints REST

| Méthode | URL | Rôle | Auth |
|---------|-----|------|------|
| `POST` | `/api/v1/messaging/conversations` | Démarrer ou récupérer une conversation | MEDECIN, PATIENT |
| `GET` | `/api/v1/messaging/conversations` | Lister toutes les conversations de l'utilisateur | MEDECIN, PATIENT |
| `GET` | `/api/v1/messaging/conversations/{convId}/messages` | Historique paginé (page, size) | MEDECIN, PATIENT |
| `POST` | `/api/v1/messaging/conversations/{convId}/messages` | Envoyer un message via REST | MEDECIN, PATIENT |
| `PUT` | `/api/v1/messaging/conversations/{convId}/read` | Marquer la conversation comme lue | MEDECIN, PATIENT |

### Endpoints STOMP

| Destination | Direction | Rôle |
|-------------|-----------|------|
| `/app/chat.send` | Client → Serveur | Envoyer un message temps réel |
| `/app/chat.read` | Client → Serveur | Marquer conversation comme lue |
| `/user/queue/messages` | Serveur → Client | Recevoir un nouveau message |

---

## Frontend — Fichiers créés/modifiés

| Fichier | Type | Rôle |
|---------|------|------|
| `lib/types.ts` | MODIFIED | Ajout interfaces `Message`, `Conversation` |
| `features/messaging/api.ts` | NEW | Appels REST (getConversations, getMessages, sendMessageRest, markRead, startConversation) |
| `features/messaging/hooks.ts` | NEW | TanStack Query hooks (useConversations, useMessages, useSendMessage, useMarkRead, useStartConversation) |
| `features/messaging/useChat.ts` | NEW | Hook WebSocket STOMP (connexion JWT, subscribe, sendMessage) |
| `features/messaging/components/MessageBubble.tsx` | NEW | Bulle de message (gauche/droite, heure, ✓/✓✓) |
| `features/messaging/components/ConversationList.tsx` | NEW | Liste conversations sidebar (badge non-lus, avatar initiales) |
| `features/messaging/components/ChatWindow.tsx` | NEW | Fenêtre de chat (envoi optimiste, auto-scroll, fallback REST) |
| `app/messages/page.tsx` | NEW | Page deux panneaux (liste + chat) |
| `components/Header.tsx` | MODIFIED | Lien "Messages" pour utilisateurs connectés |
| `package.json` | MODIFIED | Ajout `@stomp/stompjs`, `sockjs-client` |

### Types TypeScript

```typescript
interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  sentAt: string       // ISO 8601
  readAt: string | null
}

interface Conversation {
  id: string
  medecinId: string
  patientId: string
  medecinName: string
  patientName: string
  lastMessageAt: string | null
  createdAt: string
  unreadCount: number
  lastMessage: Message | null
}
```

### Hook WebSocket `useChat`

```typescript
const { connected, sendMessage } = useChat({
  conversationId: conv.id,
  onMessage: (msg) => {
    // Message reçu en temps réel — invalide le cache TanStack Query
    qc.invalidateQueries({ queryKey: ['messages', conv.id] })
  },
})

// Envoyer
sendMessage(convId, content) // retourne false si STOMP non connecté
```

- Connexion à `/ws` avec SockJS + JWT dans les headers STOMP CONNECT
- Subscribe automatique à `/user/queue/messages`
- Reconnexion automatique toutes les 5 secondes si déconnecté
- Cleanup `client.deactivate()` au démontage du composant

### Envoi optimiste dans `ChatWindow`

```
1. Afficher bulle optimiste immédiatement (id: "opt-{timestamp}")
2. Tenter STOMP sendMessage()
3a. STOMP OK → attendre le message entrant via onMessage → supprimer l'optimiste → invalider cache
3b. STOMP KO → REST sendMessageRest() → remplacer l'optimiste par la réponse serveur
4. Erreur → supprimer l'optimiste
```

---

## Structure de la page `/messages`

```
Header (lien Messages)
└── div (deux colonnes, max-w-6xl, bg-white, rounded-2xl)
    ├── aside (w-80) — ConversationList
    │   ├── titre "Messages"
    │   └── liste conversations (avatar initiales, nom, aperçu, timestamp, badge non-lus)
    │
    └── main (flex-1) — ChatWindow ou placeholder
        ├── Header chat (nom interlocuteur, indicateur connexion)
        ├── Zone messages (scroll, MessageBubble)
        └── Zone saisie (textarea, bouton envoyer, Entrée = envoyer)
```

---

## Sécurité

- Tous les endpoints REST protégés par `@PreAuthorize("hasAnyRole('MEDECIN', 'PATIENT')")`
- `assertParticipant()` dans `MessagingService` vérifie que l'appelant est bien membre de la conversation (lève `SecurityException` sinon)
- WebSocket authentifié via JWT dans le frame STOMP CONNECT — refus de connexion si token absent/invalide
- CORS WebSocket explicitement configuré sur `/ws/**`

---

## Décisions d'architecture

| Décision | Raison |
|----------|--------|
| SimpleBroker (pas RabbitMQ/Redis) | Suffisant pour un seul nœud en production PFE ; peut évoluer vers un broker externe sans changer l'API |
| Conversation standalone (pas liée au RDV) | Un seul fil persistant par paire — plus simple, historique continu |
| Principal STOMP = email | Cohérence avec `JwtAuthConverter` REST ; `convertAndSendToUser` utilise le même identifiant |
| `require('sockjs-client')` CommonJS | `sockjs-client` est un module CJS — l'import ESM échoue dans Next.js App Router |
| Fallback REST si STOMP KO | Garantit la livraison même si WebSocket bloqué (proxy, réseau d'entreprise) |
