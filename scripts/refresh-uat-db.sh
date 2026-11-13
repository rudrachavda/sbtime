#!/usr/bin/env bash
# Replace the UAT database ("sbtime-uat") with a fresh copy of production
# ("sbtime"), both on the Atlas cluster in ATLAS_URI (.env). UAT's users,
# schedules and plans are replaced too.
#
#   scripts/refresh-uat-db.sh
#
# Then adds the test accounts dev-student@sbtime.test and
# dev-staff@sbtime.test, the only users UAT's DEV "Select User" bar offers.
#
# Runs mongodump/mongorestore inside the local MongoDB container, so Docker
# must be running. The connection string is passed in the environment and
# never printed.

set -euo pipefail

cd "$(dirname "$0")/.."

ATLAS_URI="$(grep -E '^ATLAS_URI=' .env | head -n1 | cut -d= -f2-)"
if [[ -z "$ATLAS_URI" ]]; then
  echo "Set ATLAS_URI in .env to the Atlas connection string first." >&2
  exit 1
fi

echo "Copying sbtime -> sbtime-uat on Atlas (replaces UAT's data)..."
docker compose exec -T -e ATLAS_URI="$ATLAS_URI" mongodb sh -c '
  mongodump --quiet --uri "$ATLAS_URI" --db sbtime --archive --gzip |
    mongorestore --quiet --uri "$ATLAS_URI" --archive --gzip \
      --nsFrom "sbtime.*" --nsTo "sbtime-uat.*" --drop \
      --numInsertionWorkersPerCollection 4
  mongosh --quiet "$ATLAS_URI" --eval "
    const p = db.getSiblingDB(\"sbtime\"), u = db.getSiblingDB(\"sbtime-uat\");
    // Test accounts for UAT'"'"'s DEV Select User bar, which only offers
    // @sbtime.test emails (never the real people copied from production).
    const now = new Date();
    for (const [key, name, staff] of [
      [\"dev-student\", \"Dev Student\", false],
      [\"dev-staff\", \"Dev Staff\", true],
    ]) {
      u.users.updateOne(
        { email: key + \"@sbtime.test\" },
        {
          \$set: { name, staff, updatedAt: now },
          \$setOnInsert: { googleId: \"test-\" + key, createdAt: now },
        },
        { upsert: true }
      );
    }
    print(\"Test accounts:\", u.users.countDocuments({ email: /@sbtime[.]test$/ }));
    const names = p.getCollectionNames();
    const same = names.filter((c) =>
      p.getCollection(c).estimatedDocumentCount() ===
      u.getCollection(c).estimatedDocumentCount()).length;
    print(\"Done:\", same, \"of\", names.length, \"collections match production.\");
  "
' 2>&1 | sed -E 's#(mongodb(\+srv)?://)[^@]*@#\1<hidden>@#g'
