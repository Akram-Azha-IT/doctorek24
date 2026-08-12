#!/usr/bin/env bash
#
# Sauvegarde quotidienne de Doctorek.
#
# L'archive contient .env.prod, donc VMC_ENCRYPTION_KEY, donc de quoi dechiffrer
# les donnees de sante. Elle est chiffree avant de quitter la machine : une copie
# en clair chez un hebergeur tiers serait une fuite de donnees medicales.
#
# Installation : voir docs/EXPLOITATION.md
set -euo pipefail

PROJET_DIR=/home/ubuntu/doctorek
LOCAL_DIR=/home/ubuntu/backups
PASSPHRASE=/home/ubuntu/.backup-passphrase
JOURNAL=/home/ubuntu/backup.log
RETENTION_JOURS=7
DISTANT="${BACKUP_REMOTE:-b2:doctorek-backups}"

echoj() { echo "$(date -Iseconds) $*" | tee -a "$JOURNAL"; }
trap 'echoj "ECHEC a la ligne $LINENO"' ERR

cd "$PROJET_DIR"
set -a; source .env.prod; set +a
PROJET=$(basename "$PROJET_DIR")
HORO=$(date +%Y%m%d-%H%M%S)

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# ── Les trois bases, roles compris ──────────────────────────────────────
docker exec "${PROJET}-postgres-1" pg_dumpall -U "$POSTGRES_USER" \
  | gzip > "$TMP/postgres-all.sql.gz"

# Un pg_dumpall qui echoue en cours de route produit un fichier tronque mais un
# code de retour a zero via le pipe. On verifie le contenu, pas le code.
BASES=$(zcat "$TMP/postgres-all.sql.gz" | grep -c '^CREATE DATABASE' || true)
if [ "$BASES" -lt 3 ]; then
  echoj "ECHEC: dump incomplet, $BASES base(s) au lieu de 3"
  exit 1
fi

# ── Documents medicaux, certificats TLS, secrets ────────────────────────
docker run --rm -v "${PROJET}_minio_data:/data:ro" -v "$TMP:/out" \
  alpine tar czf /out/minio-data.tgz -C /data .
docker run --rm -v "${PROJET}_caddy_data:/data:ro" -v "$TMP:/out" \
  alpine tar czf /out/caddy-data.tgz -C /data .
tar czf "$TMP/secrets.tgz" .env.prod secrets docker/doctorek-realm.json

# ── Archive unique, chiffree ────────────────────────────────────────────
mkdir -p "$LOCAL_DIR"
ARCHIVE="$LOCAL_DIR/doctorek-$HORO.tar.gz.gpg"
tar czf - -C "$TMP" . \
  | gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase-file "$PASSPHRASE" -o "$ARCHIVE"
chown ubuntu:ubuntu "$ARCHIVE"

# ── Copie hors machine ──────────────────────────────────────────────────
if command -v rclone >/dev/null 2>&1; then
  rclone copy "$ARCHIVE" "$DISTANT" --log-level ERROR
else
  echoj "ATTENTION: rclone absent, archive gardee uniquement sur la VM"
fi

# ── Purge locale ────────────────────────────────────────────────────────
find "$LOCAL_DIR" -name 'doctorek-*.tar.gz.gpg' -mtime "+$RETENTION_JOURS" -delete

echoj "OK $(basename "$ARCHIVE") $(du -h "$ARCHIVE" | cut -f1)"

# Ping optionnel : si la sauvegarde ne tourne plus, healthchecks.io alerte.
# Une sauvegarde qui echoue en silence est pire que pas de sauvegarde.
[ -n "${HEALTHCHECK_URL:-}" ] && curl -fsS -m 10 "$HEALTHCHECK_URL" >/dev/null || true
