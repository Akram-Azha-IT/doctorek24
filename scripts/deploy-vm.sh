#!/usr/bin/env bash
#
# Construction et mise en service, execute sur la VM par le workflow GitHub.
#
# La compilation a lieu sur la machine de production, faute de runner ARM
# gratuit pour un depot prive. Elle est donc confinee : un seul coeur sur les
# deux, et une memoire plafonnee. Le second coeur reste entierement disponible
# pour servir les patients pendant la construction, ce qui n'etait pas le cas
# avec un "docker compose up --build" qui prend tout ce qu'il trouve.
set -euo pipefail

SRC=/home/ubuntu/doctorek-src
PROD=/home/ubuntu/doctorek
SERVICES="${1:-tous}"
TAG="${IMAGE_TAG:-manuel}"
# Numero du coeur reserve a la construction, pas un nombre de coeurs : le coeur
# 0 reste libre pour l'application.
CPUSET="${BUILD_CPUSET:-1}"
MEM="${BUILD_MEM:-6g}"

echo "== Deploiement $SERVICES, etiquette $TAG =="

LIBRE=$(df --output=avail -BG / | tail -1 | tr -dc '0-9')
if [ "$LIBRE" -lt 8 ]; then
  echo "ERREUR: seulement ${LIBRE}G libres sur /, construction annulee" >&2
  exit 1
fi

# Les fichiers versionnes sont alignes sur le depot. Ceux qui ne le sont pas
# (.env.prod, secrets/, doctorek-realm.json) ne sont jamais touches : ils
# n'existent que sur cette machine.
cp "$SRC/docker-compose.prod.yml" "$PROD/"
cp "$SRC/docker/Caddyfile" "$PROD/docker/"

set -a; source "$PROD/.env.prod"; set +a

construire_api() {
  echo "-- backend --"
  sudo docker build --cpuset-cpus="$CPUSET" --memory="$MEM" \
    -t "doctorek/api:$TAG" -t doctorek/api:latest "$SRC"
}

construire_web() {
  echo "-- frontend --"
  # Les NEXT_PUBLIC_* sont figees a la construction, elles doivent etre ici.
  sudo docker build --cpuset-cpus="$CPUSET" --memory="$MEM" \
    --build-arg "NEXT_PUBLIC_API_URL=https://api.$DOMAIN" \
    --build-arg "NEXT_PUBLIC_KEYCLOAK_URL=https://auth.$DOMAIN" \
    -t "doctorek/web:$TAG" -t doctorek/web:latest "$SRC/doctorek-frontend"
}

# Compose demande les deux images a l'etiquette du commit, meme quand un seul
# service est redeploye. Le service inchange est donc reetiquete depuis sa
# version courante, sans etre reconstruit : c'est bien le meme binaire qui
# continue de tourner. S'il n'existe pas encore, il faut le construire.
reprendre() {
  local nom="doctorek/$1"
  if sudo docker image inspect "$nom:latest" >/dev/null 2>&1; then
    echo "-- $1 inchange, reetiquete depuis latest --"
    sudo docker tag "$nom:latest" "$nom:$TAG"
  else
    echo "-- $1 absent de cette machine, construction obligatoire --"
    "construire_$1"
  fi
}

case "$SERVICES" in
  tous) construire_api; construire_web ;;
  api)  construire_api; reprendre web ;;
  web)  construire_web; reprendre api ;;
  *) echo "ERREUR: service inconnu '$SERVICES'" >&2; exit 1 ;;
esac

cd "$PROD"
# --no-build : les images viennent d'etre construites, compose ne doit surtout
# pas en refabriquer une au passage.
sudo -E IMAGE_TAG="$TAG" docker compose -f docker-compose.prod.yml \
  --env-file .env.prod up -d --no-build app frontend

sudo docker compose -f docker-compose.prod.yml --env-file .env.prod ps

# Le cache de construction avait atteint 24 Go sur cette machine. Il est
# desormais plafonne, sans etre vide : le garder accelere la construction
# suivante.
sudo docker builder prune -f --keep-storage 5GB >/dev/null
sudo docker image prune -f >/dev/null

echo "== Termine =="
