#!/bin/bash
# Deploy an atp-indexer image to this box. Runs ON the box (the deploy workflow pushes and
# invokes it via SSM).
#
#   box-deploy.sh IMAGE            metadata-only / same-app update: pull + restart. The
#                                  container adopts the current schema (same Ponder build
#                                  fingerprint) and is back at head in seconds.
#   box-deploy.sh IMAGE NEW_SCHEMA indexing-code update: Ponder refuses to reuse the old
#                                  app's schema, so run the new build as a parallel container
#                                  against NEW_SCHEMA (rebuilds from the shared ponder_sync
#                                  cache, minutes, no RPC refetch), sanity-check row counts,
#                                  then flip the serving container. The old schema stays in
#                                  Postgres as the instant rollback.
set -euo pipefail

APP_DIR=/opt/staking-dashboard-atp
IMAGE="${1:?usage: box-deploy.sh IMAGE [NEW_SCHEMA]}"
NEW_SCHEMA="${2:-}"
cd "$APP_DIR"

compose() { docker compose "$@"; }

# The serving schema and image. The running container is asked first; if it is down (a failed
# swap leaves it crash-looping) the override this script last wrote is the record of what it
# was serving. Without that fallback a box whose container is down cannot be redeployed: the
# A/B parity check runs psql against an empty schema name and set -e kills the script before
# it flips.
current_schema() {
  local s
  s="$(compose exec -T atp-indexer sh -c 'echo $DATABASE_SCHEMA' 2>/dev/null | tr -d '\r' || true)"
  [ -n "$s" ] || s="$(sed -n 's/^ *DATABASE_SCHEMA: *"\(.*\)"$/\1/p' docker-compose.override.yml 2>/dev/null || true)"
  echo "$s"
}

current_image() {
  sed -n 's/^ *image: *//p' docker-compose.override.yml 2>/dev/null || true
}

write_override() { # $1=image $2=schema
  cat > docker-compose.override.yml <<EOF
# Written by box-deploy.sh — the currently served image + schema.
services:
  atp-indexer:
    image: $1
    environment:
      DATABASE_SCHEMA: "$2"
EOF
}

wait_ready() { # $1=service $2=port $3=timeout_s
  for _ in $(seq 1 "$(($3 / 5))"); do
    if compose exec -T "$1" wget -qO- "http://localhost:$2/ready" >/dev/null 2>&1; then return 0; fi
    sleep 5
  done
  return 1
}

./refresh-ecr-login.sh >/dev/null
[ -x ./fetch-env.sh ] && ./fetch-env.sh || true
grep -q '^RPC_URL=' env/atp-indexer.env || { echo "env/atp-indexer.env not populated; aborting" >&2; exit 1; }
docker pull "$IMAGE" >/dev/null

CURRENT="$(current_schema)"
PREVIOUS_IMAGE="$(current_image)"
echo "current schema: ${CURRENT:-<none>}  requested: ${NEW_SCHEMA:-<same>}"

if [ -z "$NEW_SCHEMA" ] || [ "$NEW_SCHEMA" = "$CURRENT" ]; then
  # Same-app update: swap the image in place.
  write_override "$IMAGE" "${CURRENT:?cannot determine current schema; pass NEW_SCHEMA explicitly}"
  compose up -d atp-indexer
  if ! wait_ready atp-indexer 42068 120; then
    # Ponder fingerprints the whole src/ tree, so an image whose indexing code differs refuses to
    # start on the old schema. Put the previous image back rather than leave the API down.
    echo "serving container failed /ready after image swap; restoring ${PREVIOUS_IMAGE:-<unknown>}" >&2
    if [ -n "$PREVIOUS_IMAGE" ]; then
      write_override "$PREVIOUS_IMAGE" "$CURRENT"
      compose up -d atp-indexer
    fi
    exit 1
  fi
  echo "deployed $IMAGE on schema $CURRENT"
  exit 0
fi

# A/B: build the new schema in a parallel container while the current one keeps serving.
cat > docker-compose.ab.yml <<EOF
services:
  atp-indexer-next:
    image: $IMAGE
    restart: unless-stopped
    command: ["yarn", "start"]
    env_file: [./env/atp-indexer.env]
    environment:
      POSTGRES_CONNECTION_STRING: "postgresql://ponder:ponder@local-postgres:5432/ponder"
      DATABASE_SCHEMA: "$NEW_SCHEMA"
      NODE_ENV: "production"
      PORT: "42069"
    depends_on:
      local-postgres: { condition: service_healthy }
EOF
compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.ab.yml up -d atp-indexer-next

echo "waiting for the new schema to rebuild from the ponder_sync cache (timeout 45m)..."
# Ponder logs 'Completed backfill indexing' only on a fresh build. A builder that resumed an
# existing schema (a rerun of the same NEW_SCHEMA) never prints it, so its /ready is checked too.
abc() { compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.ab.yml "$@"; }
next_ready() {
  abc logs atp-indexer-next 2>/dev/null | grep -q 'Completed backfill indexing' \
    || abc exec -T atp-indexer-next wget -qO- http://localhost:42069/ready >/dev/null 2>&1
}
for _ in $(seq 1 270); do
  next_ready && break
  sleep 10
done
next_ready || { echo "backfill did not complete in time; leaving current container serving" >&2; exit 1; }

# Sanity: the new schema must hold at least as much history as the old (staking is live, so
# strictly-fewer rows means the rebuild is wrong).
psql_count() { compose exec -T local-postgres psql -U ponder -d ponder -tAc "select count(*) from \"$1\".atp_position" 2>/dev/null | tr -d '\r' || true; }
OLD_N="$(psql_count "$CURRENT")"; NEW_N="$(psql_count "$NEW_SCHEMA")"
echo "atp_position: old($CURRENT)=$OLD_N new($NEW_SCHEMA)=$NEW_N"
[ -n "$NEW_N" ] && [ "$NEW_N" -ge "${OLD_N:-0}" ] || { echo "parity check failed; not flipping" >&2; exit 1; }

# Flip: serve the new image+schema, retire the builder.
write_override "$IMAGE" "$NEW_SCHEMA"
compose up -d atp-indexer
wait_ready atp-indexer 42068 120 || { echo "serving container failed /ready after flip" >&2; exit 1; }
compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.ab.yml rm -sf atp-indexer-next >/dev/null 2>&1 || true
rm -f docker-compose.ab.yml
echo "deployed $IMAGE on schema $NEW_SCHEMA (previous schema $CURRENT retained as rollback)"
