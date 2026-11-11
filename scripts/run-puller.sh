#!/usr/bin/env bash
# Run a datapuller job from your machine against the local MongoDB container.
#
#   scripts/run-puller.sh <puller> [database]
#
#   scripts/run-puller.sh terms-all            # writes to the "sbtime" database
#   scripts/run-puller.sh terms-nearby bt      # writes to another database
#
# The app's own MONGODB_URI points at the Docker network hostname, which is not
# reachable from the host, so this builds a localhost URI from the credentials
# in .env instead. UCSB data goes to its own database ("sbtime" by default) so
# it never mixes with the Berkeley seed data in "bt".

set -euo pipefail

cd "$(dirname "$0")/.."

PULLER="${1:?Usage: scripts/run-puller.sh <puller> [database]}"
DATABASE="${2:-sbtime}"

[[ -f .env ]] || { echo "Missing .env (copy .env.template first)." >&2; exit 1; }

read_env() { grep -E "^$1=" .env | head -n1 | cut -d= -f2- || true; }

MONGO_USER="$(read_env MONGODB_ROOT_USERNAME)"
MONGO_PASSWORD="$(read_env MONGODB_ROOT_PASSWORD)"
PORT_PREFIX="$(read_env DEV_PORT_PREFIX)"
PORT="${PORT_PREFIX:-30}08"

[[ -n "$MONGO_USER" && -n "$MONGO_PASSWORD" ]] || {
  echo "MONGODB_ROOT_USERNAME / MONGODB_ROOT_PASSWORD are not set in .env." >&2
  exit 1
}

export MONGODB_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@127.0.0.1:${PORT}/${DATABASE}?authSource=admin&directConnection=true"

echo "Running puller \"${PULLER}\" against database \"${DATABASE}\" on 127.0.0.1:${PORT}"

cd apps/datapuller
# dotenv does not override variables that are already set, so MONGODB_URI above wins.
exec npx tsx --env-file=../../.env src/main.ts --puller="${PULLER}"
