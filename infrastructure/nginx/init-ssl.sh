#!/usr/bin/env bash
# Usage: ./infrastructure/nginx/init-ssl.sh <domain> <email>
# Example: ./infrastructure/nginx/init-ssl.sh example.com admin@example.com
#
# What it does:
#   1. Requests a Let's Encrypt certificate via certbot (webroot challenge over HTTP)
#   2. Generates DH params for forward secrecy
#   3. Writes HTTPS nginx config from the template (replaces conf.d/default.conf)
#   4. Reloads nginx in-place — no downtime
#
# Prerequisites:
#   - docker compose is up (at minimum: nginx, certbot)
#   - Port 80 is reachable from the internet under <domain>
#   - nginx is running with the HTTP config (default state after docker compose up)

set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"

# Resolve project root regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONF_D="${SCRIPT_DIR}/conf.d"
TEMPLATES="${SCRIPT_DIR}/templates"

cd "${PROJECT_ROOT}"

echo "==> Requesting certificate for ${DOMAIN} (email: ${EMAIL})..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  -d "${DOMAIN}"

echo "==> Generating DH parameters (2048-bit, may take a minute)..."
docker compose run --rm certbot sh -c \
  "[ -f /etc/letsencrypt/ssl-dhparams.pem ] \
   || openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048"

echo "==> Writing HTTPS nginx config for ${DOMAIN}..."
sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" \
  "${TEMPLATES}/https.conf" > "${CONF_D}/default.conf"

echo "==> Reloading nginx..."
docker compose exec nginx nginx -s reload

echo ""
echo "Done. HTTPS is live at https://${DOMAIN}"
echo ""
echo "Auto-renewal — add to crontab (crontab -e):"
echo "  0 3 * * 1 cd ${PROJECT_ROOT} && docker compose run --rm certbot certbot renew --quiet && docker compose exec nginx nginx -s reload"
