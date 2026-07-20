# Pipeline DevSecOps — Doctorek

Chaîne de sécurité CI/CD complète (GitHub Actions). Données de santé des citoyens ⇒ tolérance zéro sur les vulnérabilités connues.

## Vue d'ensemble

| # | Contrôle | Outil | Workflow | Déclencheur |
|---|----------|-------|----------|-------------|
| 1 | CI/CD (build + tests) | Maven, npm, Docker | `.github/workflows/ci.yml` | push/PR master |
| 2 | SAST | SonarQube Community (self-hosted VPS) | `.github/workflows/sonar.yml` | push/PR master |
| 3 | DAST | OWASP ZAP baseline | `.github/workflows/dast.yml` | hebdo + manuel |
| 4 | Secret scanning | Gitleaks (historique complet) | `.github/workflows/security.yml` | push/PR + hebdo |
| 5 | SCA | Trivy (fs + images) + Dependabot | `security.yml` + `.github/dependabot.yml` | push/PR + hebdo |
| 6 | SBOM | Syft → CycloneDX JSON | `security.yml` (job image-scan) | push/PR + hebdo |

Bonus : Trivy `config` scanne les Dockerfiles / docker-compose (misconfigurations IaC).

## Configuration requise (une fois, sur GitHub)

### SonarQube Community self-hosted (SAST)
Repo privé ⇒ SonarCloud gratuit indisponible. SonarQube Community tourne sur le VPS
(`sonar.$DOMAIN`, service `sonarqube` dans `docker-compose.prod.yml`, base `sonar_db`
dans le Postgres existant).

**Déploiement VPS (une fois) :**
```bash
# 1. DNS : ajouter un A record  sonar.$DOMAIN → IP du VPS

# 2. Prérequis Elasticsearch (persistant après reboot)
echo "vm.max_map_count=262144" | sudo tee /etc/sysctl.d/99-sonarqube.conf
sudo sysctl --system

# 3. Créer la base (le script d'init ne rejoue pas sur un volume existant)
sudo docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE sonar_db;"'

# 4. Démarrer
git pull
sudo docker compose -f docker-compose.prod.yml --env-file .env.prod up -d sonarqube caddy
```

**Config initiale (UI `https://sonar.$DOMAIN`) :**
1. Login `admin` / `admin` → changement de mot de passe forcé (mot de passe fort, gestionnaire de mots de passe).
2. Créer 2 projets *locaux* : `doctorek-backend` et `doctorek-frontend` (Project Key = même valeur).
3. Token CI : My Account → Security → Generate token (type **Global Analysis Token**).

**Côté GitHub (Settings → Secrets and variables → Actions) :**
- **Secret** `SONAR_TOKEN` : le token généré.
- **Variables** : `SONAR_ENABLED=true`, `SONAR_HOST_URL=https://sonar.<domaine>`,
  `SONAR_PROJECT_KEY_BACKEND=doctorek-backend`, `SONAR_PROJECT_KEY_FRONTEND=doctorek-frontend`.

Tant que `SONAR_ENABLED` n'est pas `true`, le workflow Sonar est ignoré (pas d'échec).
`sonar.qualitygate.wait=true` : le job échoue si le quality gate est rouge (bloquant).

**RAM** : SonarQube bridé à ~1,5 Go (heaps 512m ×3). Vérifier `free -h` sur le VPS ;
si mémoire insuffisante, envisager un upgrade VPS ou héberger Sonar ailleurs.

### DAST (OWASP ZAP)
- **Variable** `DAST_TARGET_URL` : URL publique de l'app (ex. `https://app.<domaine>`).
- Scan *baseline* = passif uniquement, sans requêtes d'attaque — sûr contre la prod.
- Lancement manuel possible : Actions → « DAST (OWASP ZAP) » → Run workflow.
- Les findings sont publiés comme issue GitHub + artifact HTML.

### Dependabot
- Actif dès le merge de `.github/dependabot.yml` — aucune config supplémentaire.
- Recommandé : Settings → Code security → activer **Dependabot security updates**.

## Politique de blocage

- **Gitleaks** : bloque le pipeline si secret détecté (n'importe où dans l'historique).
- **Trivy dépendances** : bloque sur CVE CRITICAL/HIGH corrigeables (`ignore-unfixed: true`).
- **Trivy images** : bloque sur CRITICAL/HIGH corrigeables dans les images finales.
- **Trivy config (IaC)** : informatif pour l'instant (`exit-code: 0`) — passer à `1` après triage initial.
- **SonarQube** : quality gate configurable côté SonarCloud (recommandé : « Sonar way » + 0 nouveau bug/vulnérabilité).
- **ZAP** : ne bloque pas (hebdo, hors pipeline de livraison) — crée une issue à traiter.

## SBOM

Chaque exécution du workflow Security produit deux artifacts CycloneDX JSON :
`sbom-backend.cyclonedx.json` et `sbom-frontend.cyclonedx.json`
(Actions → run → Artifacts). Inventaire complet des composants — exigence supply chain
(réponse rapide à une alerte type Log4Shell : chercher le composant dans le SBOM).

## Si Gitleaks trouve un secret

1. **Révoquer/faire tourner le secret immédiatement** (le retirer du code ne suffit pas — l'historique git l'expose).
2. Le remplacer par une variable d'environnement (`.env`, non commité).
3. Purger l'historique si nécessaire (`git filter-repo`) puis force-push coordonné.

## Reste à faire (recommandé)

- [ ] Déployer SonarQube sur le VPS + configurer secrets/variables GitHub + `DAST_TARGET_URL` (voir ci-dessus).
- [ ] Activer Dependabot security updates dans les settings GitHub.
- [ ] Protéger la branche `master` : require status checks (CI, Security) avant merge.
- [ ] Après triage IaC : passer `iac-scan` en bloquant.
- [ ] CD : ajouter un job de déploiement VPS (SSH + `docker compose pull/up`) déclenché après succès CI+Security sur master.
