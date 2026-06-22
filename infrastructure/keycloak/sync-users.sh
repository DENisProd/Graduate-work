#!/usr/bin/env bash
# Sync Keycloak users guest/user and align access-service externalUserId
set -euo pipefail

CONTAINER="${KEYCLOAK_CONTAINER:-smart-home-keycloak}"
REALM="${KEYCLOAK_REALM:-smart-home}"
KC="docker exec -i ${CONTAINER} /opt/keycloak/bin/kcadm.sh"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ACCESS_DIR="${ROOT}/backend/apps/access-service"

admin_user="${KEYCLOAK_SYNC_ADMIN_USER:-kc-sync}"
admin_password="${KEYCLOAK_SYNC_ADMIN_PASSWORD:-AdminReset123!}"

echo "→ Keycloak admin login (${CONTAINER})"
if ! $KC config credentials \
  --server http://127.0.0.1:8080 \
  --realm master \
  --user "${admin_user}" \
  --password "${admin_password}" 2>/dev/null; then
  echo "   Admin login failed. Bootstrap temp admin (Keycloak must be stopped first):"
  echo "   cd infrastructure && docker compose stop keycloak"
  echo "   docker run --rm -v infrastructure_keycloak_data:/opt/keycloak/data \\"
  echo "     -e KC_BOOTSTRAP_PASSWORD=AdminReset123! quay.io/keycloak/keycloak:latest \\"
  echo "     bootstrap-admin user --username kc-sync --password:env KC_BOOTSTRAP_PASSWORD --no-prompt"
  echo "   docker compose up -d keycloak"
  exit 1
fi

upsert_user() {
  local username="$1" password="$2" email="$3" first="$4" last="$5"
  local existing
  existing=$($KC get users -r "$REALM" -q "username=${username}" --fields id,username 2>/dev/null | grep -o '"id" : "[^"]*"' | head -1 | cut -d'"' -f4 || true)

  if [ -n "$existing" ]; then
    echo "   ↻ ${username} (${existing})" >&2
    $KC set-password -r "$REALM" --username "${username}" --new-password "${password}" --temporary=false >/dev/null
  else
    echo "   + ${username}" >&2
    $KC create users -r "$REALM" \
      -s "username=${username}" \
      -s "enabled=true" \
      -s "emailVerified=true" \
      -s "email=${email}" \
      -s "firstName=${first}" \
      -s "lastName=${last}" >/dev/null
    $KC set-password -r "$REALM" --username "${username}" --new-password "${password}" --temporary=false >/dev/null
    existing=$($KC get users -r "$REALM" -q "username=${username}" --fields id 2>/dev/null | grep -o '"id" : "[^"]*"' | head -1 | cut -d'"' -f4 || true)
  fi
  printf '%s' "${existing}"
}

echo "→ Sync users in realm ${REALM}"
GUEST_KC_ID=$(upsert_user "guest" "guest" "guest@example.local" "Guest" "User")
USER_KC_ID=$(upsert_user "user" "user" "user@example.local" "User" "Demo")

echo "→ Align access-service users (Keycloak sub → externalUserId)"
cd "${ACCESS_DIR}"
GUEST_KC_ID="${GUEST_KC_ID}" USER_KC_ID="${USER_KC_ID}" npx ts-node prisma/sync-keycloak-users.ts

IDS_FILE="${ROOT}/.sync-keycloak-ids.env"
printf 'GUEST_KC_ID=%s\nUSER_KC_ID=%s\n' "${GUEST_KC_ID}" "${USER_KC_ID}" > "${IDS_FILE}"
echo "   wrote ${IDS_FILE}"

echo "✅ Keycloak users synced (guest/guest, user/user)"
