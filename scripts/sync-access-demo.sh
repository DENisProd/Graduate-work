#!/usr/bin/env bash
# Full sync: backfill PAGE resources, demo access seed, Keycloak users
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ACCESS_DIR="${ROOT}/backend/apps/access-service"

echo "=== 1/4 Backfill PAGE resources for existing houses ==="
cd "${ACCESS_DIR}"
npx ts-node prisma/backfill-house-pages.ts

echo ""
echo "=== 2/4 Keycloak users (guest, user) ==="
bash "${ROOT}/infrastructure/keycloak/sync-users.sh"

echo ""
echo "=== 4/5 Demo house seed ==="
cd "${ACCESS_DIR}"
if [ -f "${ROOT}/.sync-keycloak-ids.env" ]; then
  # shellcheck disable=SC1091
  source "${ROOT}/.sync-keycloak-ids.env"
  DEMO_GUEST_KEYCLOAK_ID="${GUEST_KC_ID}" DEMO_USER_KEYCLOAK_ID="${USER_KC_ID}" npx ts-node prisma/seed-demo-access.ts
else
  npx ts-node prisma/seed-demo-access.ts
fi

IVAN_HOUSE_ID="${IVAN_HOUSE_ID:-c980693b-ac9a-48e0-b91d-522307295cd0}"
echo ""
echo "=== 5/5 Ivan house seed (${IVAN_HOUSE_ID}) ==="
if [ -f "${ROOT}/.sync-keycloak-ids.env" ]; then
  source "${ROOT}/.sync-keycloak-ids.env"
fi
HOUSE_ID="${IVAN_HOUSE_ID}" \
  DEMO_GUEST_KEYCLOAK_ID="${GUEST_KC_ID:-}" \
  DEMO_USER_KEYCLOAK_ID="${USER_KC_ID:-}" \
  npx ts-node prisma/seed-house-access.ts

echo ""
echo "=== Done ==="

echo ""
echo "✅ All sync steps complete."
echo "   Restart access-service to load new API: GET /api/access/v1/houses/:id/page-access"
echo "   Demo house: c3333333-3333-4333-b333-333333333333"
echo "   Accounts: guest/guest, user/user, admin/admin"
