#!/bin/sh
# Idempotent EMQX bootstrap: MQTT user + ACL for scenario-service.
# Requires mqtt-gateway healthy. Re-run safe after password/env changes.
set -eu

EMQX_HOST="${EMQX_HOST:-mqtt-gateway}"
EMQX_PORT="${EMQX_PORT:-18083}"
EMQX_API="http://${EMQX_HOST}:${EMQX_PORT}/api/v5"

ADMIN_USER="${EMQX_ADMIN_USER:-admin}"
ADMIN_PASS="${EMQX_DASHBOARD_PASSWORD:-changeme}"

MQTT_USER="${SCENARIO_SERVICE_MQTT_USERNAME:-scenario-service}"
MQTT_PASS="${SCENARIO_SERVICE_MQTT_PASSWORD:-}"

if [ -z "$MQTT_PASS" ]; then
  echo "ERROR: SCENARIO_SERVICE_MQTT_PASSWORD is empty. Set it in infrastructure/.env (same value as CENTRAL_MQTT_PASSWORD in root .env)." >&2
  exit 1
fi

AUTHN_ID="password_based%3Abuilt_in_database"

echo "Waiting for EMQX API at ${EMQX_API}..."
for i in $(seq 1 60); do
  if curl -sf "${EMQX_API}/status" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "ERROR: EMQX API not ready" >&2
    exit 1
  fi
  sleep 2
done

echo "Logging in as dashboard admin..."
login_resp=$(curl -sf -X POST "${EMQX_API}/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")

TOKEN=$(printf '%s' "$login_resp" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then
  echo "ERROR: failed to obtain EMQX API token. Check EMQX_DASHBOARD_PASSWORD." >&2
  echo "Response: $login_resp" >&2
  exit 1
fi

auth_hdr="Authorization: Bearer ${TOKEN}"

echo "Ensuring password authenticator is enabled..."
authn_code=$(curl -s -o /tmp/emqx-authn.json -w '%{http_code}' -X PUT \
  "${EMQX_API}/authentication/${AUTHN_ID}" \
  -H "$auth_hdr" \
  -H 'Content-Type: application/json' \
  -d '{"mechanism":"password_based","backend":"built_in_database","enable":true,"password_hash_algorithm":{"name":"bcrypt"}}')

if [ "$authn_code" -ge 200 ] && [ "$authn_code" -lt 300 ]; then
  echo "Password authenticator ready"
else
  echo "WARN: authenticator setup returned HTTP ${authn_code}" >&2
  cat /tmp/emqx-authn.json >&2
fi

echo "Provisioning MQTT user: ${MQTT_USER}"
user_code=$(curl -s -o /tmp/emqx-user.json -w '%{http_code}' -X POST \
  "${EMQX_API}/authentication/${AUTHN_ID}/users" \
  -H "$auth_hdr" \
  -H 'Content-Type: application/json' \
  -d "{\"user_id\":\"${MQTT_USER}\",\"password\":\"${MQTT_PASS}\"}")

if [ "$user_code" = "409" ] || [ "$user_code" = "400" ]; then
  put_code=$(curl -s -o /tmp/emqx-user-put.json -w '%{http_code}' -X PUT \
    "${EMQX_API}/authentication/${AUTHN_ID}/users/${MQTT_USER}" \
    -H "$auth_hdr" \
    -H 'Content-Type: application/json' \
    -d "{\"password\":\"${MQTT_PASS}\"}")
  if [ "$put_code" -ge 200 ] && [ "$put_code" -lt 300 ]; then
    echo "Updated password for existing user ${MQTT_USER}"
  else
    echo "ERROR: user update failed (HTTP ${put_code})" >&2
    cat /tmp/emqx-user-put.json >&2
    exit 1
  fi
elif [ "$user_code" -ge 200 ] && [ "$user_code" -lt 300 ]; then
  echo "Created user ${MQTT_USER}"
else
  echo "ERROR: user provisioning failed (HTTP ${user_code})" >&2
  cat /tmp/emqx-user.json >&2
  exit 1
fi

verify_code=$(curl -s -o /tmp/emqx-user-get.json -w '%{http_code}' \
  "${EMQX_API}/authentication/${AUTHN_ID}/users/${MQTT_USER}" \
  -H "$auth_hdr")
if [ "$verify_code" != "200" ]; then
  echo "ERROR: user ${MQTT_USER} not found after provisioning (HTTP ${verify_code})" >&2
  cat /tmp/emqx-user-get.json >&2
  exit 1
fi
echo "Verified user ${MQTT_USER} exists in EMQX"

echo "Applying ACL rules for ${MQTT_USER}..."
acl_payload='{
  "rules": [
    {"permission": "allow", "action": "subscribe", "topic": "houses/+/zigbee2mqtt/#"},
    {"permission": "allow", "action": "publish", "topic": "houses/+/zigbee2mqtt/#"},
    {"permission": "allow", "action": "subscribe", "topic": "modbus/response"},
    {"permission": "allow", "action": "publish", "topic": "modbus/command"}
  ]
}'

acl_code=$(curl -s -o /tmp/emqx-acl.json -w '%{http_code}' -X PUT \
  "${EMQX_API}/authorization/sources/built_in_database/rules/users/${MQTT_USER}" \
  -H "$auth_hdr" \
  -H 'Content-Type: application/json' \
  -d "$acl_payload")

if [ "$acl_code" -ge 200 ] && [ "$acl_code" -lt 300 ]; then
  echo "ACL rules applied for ${MQTT_USER}"
elif [ "$acl_code" = "409" ]; then
  echo "ACL rules already exist for ${MQTT_USER}"
else
  echo "WARN: ACL PUT returned HTTP ${acl_code}, trying POST..."
  post_payload=$(cat <<EOF
[{"username":"${MQTT_USER}","rules":[
  {"permission":"allow","action":"subscribe","topic":"houses/+/zigbee2mqtt/#"},
  {"permission":"allow","action":"publish","topic":"houses/+/zigbee2mqtt/#"},
  {"permission":"allow","action":"subscribe","topic":"modbus/response"},
  {"permission":"allow","action":"publish","topic":"modbus/command"}
]}]
EOF
)
  acl_code=$(curl -s -o /tmp/emqx-acl.json -w '%{http_code}' -X POST \
    "${EMQX_API}/authorization/sources/built_in_database/rules/users" \
    -H "$auth_hdr" \
    -H 'Content-Type: application/json' \
    -d "$post_payload")
  if [ "$acl_code" -ge 200 ] && [ "$acl_code" -lt 300 ]; then
    echo "ACL rules created for ${MQTT_USER}"
  elif [ "$acl_code" = "409" ]; then
    echo "ACL rules already exist for ${MQTT_USER}"
  else
    echo "ERROR: ACL provisioning failed (HTTP ${acl_code})" >&2
    cat /tmp/emqx-acl.json >&2
    exit 1
  fi
fi

echo "EMQX bootstrap complete."
