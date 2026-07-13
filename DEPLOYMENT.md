# Doctorek — Guide de déploiement

## Architecture

| Service | Image | Port | Rôle |
|---|---|---|---|
| `app` | `Dockerfile` (racine) | 8080 | API Spring Boot |
| frontend | `doctorek-frontend/Dockerfile` | 3000 | Next.js (standalone) |
| `postgres` | postgres:15 | 5432 | Base (schémas auth/annuaire/agenda/… + keycloak_db) |
| `keycloak` | keycloak:25.0 | 9080 | Authentification (realm `doctorek`) |
| `redis` | redis:7 | 6379 | Cache (créneaux, médecins) |
| `minio` | minio | 9000 | Documents médicaux |
| `mailhog` | mailhog | 1025/8025 | SMTP **dev uniquement** — remplacer par un vrai SMTP en prod |

## 1. Variables d'environnement

- Racine : copier `.env.example` → `.env` (Postgres, Keycloak admin + client secret, MinIO).
- Frontend : copier `doctorek-frontend/.env.example` → `.env.local` (`AUTH_SECRET` via `npx auth secret`).
- **Production** : définir en plus `VMC_ENCRYPTION_KEY` (`openssl rand -base64 32`), SMTP réel, et `SPRING_PROFILES_ACTIVE=prod`.
- Aucun fichier `.env*` n'est commité (vérifié). Le secret client Keycloak a été retiré du code et **régénéré** — l'ancienne valeur présente dans l'historique git est révoquée.

## 2. Build & run

```bash
# Backend (image: non-root + healthcheck actuator)
docker build -t doctorek-api .

# Frontend (NEXT_PUBLIC_* figées au build)
docker build -t doctorek-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.doctorek.ma \
  --build-arg NEXT_PUBLIC_KEYCLOAK_URL=https://auth.doctorek.ma \
  doctorek-frontend

# Stack dev complète
docker compose up -d
```

## 3. Profil production (backend)

`SPRING_PROFILES_ACTIVE=prod` active `application-prod.properties` :
- tout vient de l'environnement (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `CORS_ALLOWED_ORIGINS`, `VMC_ENCRYPTION_KEY`, SMTP) ;
- Swagger/API-docs **désactivés** ;
- Actuator limité à `/actuator/health` (détails aux appels autorisés) ;
- pas de SQL logging.

## 4. Keycloak en production

Le compose actuel est un setup **dev** (`start-dev`, HTTP). Pour la prod :

```yaml
command: start --optimized
environment:
  KC_HOSTNAME: auth.doctorek.ma
  KC_PROXY_HEADERS: xforwarded      # derrière un reverse proxy TLS
  KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}   # jamais "admin"
```

- TLS obligatoire (reverse proxy nginx/traefik ou `KC_HTTPS_*`).
- Realm `doctorek` : `sslRequired=all`, brute-force protection déjà activée, thème `doctorek` monté via volume.
- Redirect URIs du client `doctorek-frontend` : remplacer `http://localhost:3000/*` par le domaine réel.

## 5. Checklist avant mise en production

- [x] Aucun secret hardcodé dans le code (scan effectué, fallback Keycloak supprimé, secret régénéré)
- [x] Mot de passe admin seedé en clair neutralisé (migration V29)
- [x] `.env`/`.env.local`/`secrets/*.json` ignorés par git
- [x] Logs DEBUG/TRACE sécurité retirés
- [x] Swagger + actuator restreints en prod
- [x] Images Docker : multi-stage, non-root, HEALTHCHECK, versions épinglées
- [x] Backend : `mvnw test` vert ; Frontend : `tsc` 0 erreur + `next build` vert
- [ ] TLS sur tous les endpoints (reverse proxy)
- [ ] SMTP réel (remplacer MailHog) + `MAIL_*`
- [ ] Sauvegardes Postgres (pg_dump quotidien + volume)
- [ ] `npm audit` / `mvn dependency:tree` — revue CVE périodique

## 6. Rollback

- Images taguées par commit (`doctorek-api:<sha>`) → redéployer le tag précédent.
- Migrations Flyway additives uniquement (pas de DROP) — compatible rollback applicatif.

---

## 7. Déploiement VPS pas à pas (test avec 5 utilisateurs)

Fichiers prêts : `docker-compose.prod.yml`, `docker/Caddyfile`, `.env.prod.example`, `docker/doctorek-realm.json` (export Keycloak — **jamais dans git**, transfert scp).

### Étape 1 — Serveur
- VPS 2 vCPU / 4 Go RAM minimum (Keycloak + Spring + Next) : Hetzner CX22 (~4 €/mois), Contabo, DigitalOcean… ou **Oracle Cloud Free Tier** (ARM 4 cœurs/24 Go, gratuit).
- Ubuntu 22.04+, puis : `curl -fsSL https://get.docker.com | sh`

### Étape 2 — Domaine + DNS
- Un domaine (ex. `.xyz` à ~2 €/an) ; créer 3 enregistrements **A** vers l'IP du VPS :
  `app.mondomaine.xyz`, `api.mondomaine.xyz`, `auth.mondomaine.xyz`
- Caddy obtient les certificats Let's Encrypt automatiquement au premier démarrage.

### Étape 3 — Transférer le projet
```bash
# Depuis le PC (le realm export part par scp, pas par git)
git archive -o doctorek.tar.gz HEAD
scp doctorek.tar.gz docker/doctorek-realm.json root@IP:/opt/
ssh root@IP 'mkdir -p /opt/doctorek && tar xzf /opt/doctorek.tar.gz -C /opt/doctorek && mv /opt/doctorek-realm.json /opt/doctorek/docker/'
```

### Étape 4 — Adapter les URLs locales → domaine (sur le serveur)
```bash
cd /opt/doctorek
export DOMAIN=mondomaine.xyz
# Realm : redirect URIs, webOrigins, frame-ancestors du login
sed -i "s#http://localhost:3000#https://app.$DOMAIN#g" docker/doctorek-realm.json
# Thème login : liens vers l'app
sed -i "s#http://localhost:3000#https://app.$DOMAIN#g" docker/keycloak-themes/doctorek/login/theme.properties
```

### Étape 5 — Configuration + lancement
```bash
cp .env.prod.example .env.prod && nano .env.prod   # remplir DOMAIN + tous les secrets
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml logs -f app   # attendre "Started DoctorekApplication"
```

### Étape 6 — Vérifications post-déploiement
1. `https://auth.mondomaine.xyz` → console Keycloak (admin / KEYCLOAK_ADMIN_PASSWORD)
2. **Google login** : Google Cloud Console → OAuth client → ajouter l'URI de redirection
   `https://auth.mondomaine.xyz/realms/doctorek/broker/google/endpoint`
3. `https://api.mondomaine.xyz/actuator/health` → `{"status":"UP"}`
4. `https://app.mondomaine.xyz` → inscription réelle : code reçu par email (Brevo), compte bloqué avant code, login après.

### Étape 7 — Inviter les 5 testeurs
Envoyer simplement `https://app.mondomaine.xyz` : chacun s'inscrit avec son vrai email (patient) — le flux complet (code email, RDV, notifications, documents à préparer, rappel 30 min) est autonome. Créer 1-2 comptes médecins de test pour eux (inscription médecin nécessite un INPE — n'importe quelle valeur unique en test).

Suivi des retours : Brevo → Logs pour les emails ; `docker compose logs -f app` pour les erreurs.
