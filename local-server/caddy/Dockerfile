# ── Build frontend ────────────────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /app

RUN npm install -g pnpm

# Install deps first (layer-cached until package files change)
COPY local-frontend/package.json local-frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY local-frontend .
RUN pnpm build

# ── Final: Caddy + built assets ───────────────────────────────────────────────
FROM caddy:2-alpine
COPY --from=frontend-builder /app/dist /srv
COPY caddy/Caddyfile /etc/caddy/Caddyfile
