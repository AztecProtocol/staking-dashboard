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

current_schema() {
  compose exec -T atp-indexer sh -c 'echo $DATABASE_SCHEMA' 2>/dev/null | tr -d '\r' || true
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
echo "current schema: ${CURRENT:-<none>}  requested: ${NEW_SCHEMA:-<same>}"

if [ -z "$NEW_SCHEMA" ] || [ "$NEW_SCHEMA" = "$CURRENT" ]; then
  # Same-app update: swap the image in place.
  write_override "$IMAGE" "${CURRENT:?cannot determine current schema; pass NEW_SCHEMA explicitly}"
  compose up -d atp-indexer
  wait_ready atp-indexer 42068 120 || { echo "serving container failed /ready after image swap" >&2; exit 1; }
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
for _ in $(seq 1 270); do
  if compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.ab.yml logs atp-indexer-next 2>/dev/null | grep -q 'Completed backfill indexing'; then
    break
  fi
  sleep 10
done
compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.ab.yml logs atp-indexer-next 2>/dev/null | grep -q 'Completed backfill indexing' \
  || { echo "backfill did not complete in time; leaving current container serving" >&2; exit 1; }

# Sanity: the new schema must hold at least as much history as the old (staking is live, so
# strictly-fewer rows means the rebuild is wrong).
psql_count() { compose exec -T local-postgres psql -U ponder -d ponder -tAc "select count(*) from \"$1\".atp_position" 2>/dev/null | tr -d '\r'; }
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
