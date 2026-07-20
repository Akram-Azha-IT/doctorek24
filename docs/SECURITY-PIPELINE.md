# Pipeline DevSecOps — Doctorek

Chaîne de sécurité CI/CD complète (GitHub Actions). Données de santé des citoyens ⇒ tolérance zéro sur les vulnérabilités connues.

## Vue d'ensemble

| # | Contrôle | Outil | Workflow | Déclencheur |
|---|----------|-------|----------|-------------|
| 1 | CI/CD (build + tests) | Maven, npm, Docker | `.github/workflows/ci.yml` | push/PR master |
| 2 | SAST | SonarQube Cloud | `.github/workflows/sonar.yml` | push/PR master |
| 3 | DAST | OWASP ZAP baseline | `.github/workflows/dast.yml` | hebdo + manuel |
| 4 | Secret scanning | Gitleaks (historique complet) | `.github/workflows/security.yml` | push/PR + hebdo |
| 5 | SCA | Trivy (fs + images) + Dependabot | `security.yml` + `.github/dependabot.yml` | push/PR + hebdo |
| 6 | SBOM | Syft → CycloneDX JSON | `security.yml` (job image-scan) | push/PR + hebdo |

Bonus : Trivy `config` scanne les Dockerfiles / docker-compose (misconfigurations IaC).

## Configuration requise (une fois, sur GitHub)

### SonarQube Cloud (SAST)
1. Créer un compte sur https://sonarcloud.io (gratuit pour repos publics) et importer le repo `doctorek24`.
2. Créer deux projets : un backend, un frontend (noter les `projectKey`).
3. Dans le repo GitHub → Settings → Secrets and variables → Actions :
   - **Secret** `SONAR_TOKEN` : token généré sur SonarCloud (My Account → Security).
   - **Variables** : `SONAR_ENABLED=true`, `SONAR_ORG`, `SONAR_PROJECT_KEY_BACKEND`, `SONAR_PROJECT_KEY_FRONTEND`.

Tant que `SONAR_ENABLED` n'est pas `true`, le workflow Sonar est ignoré (pas d'échec).

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

- [ ] Configurer secrets/variables SonarCloud + `DAST_TARGET_URL` (voir ci-dessus).
- [ ] Activer Dependabot security updates dans les settings GitHub.
- [ ] Protéger la branche `master` : require status checks (CI, Security) avant merge.
- [ ] Après triage IaC : passer `iac-scan` en bloquant.
- [ ] CD : ajouter un job de déploiement VPS (SSH + `docker compose pull/up`) déclenché après succès CI+Security sur master.
