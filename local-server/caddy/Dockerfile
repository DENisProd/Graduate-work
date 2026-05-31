# ── Build frontend ────────────────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /app

RUN npm install -g pnpm@10

# Install deps first (layer-cached until package files change)
COPY local-frontend/package.json local-frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build (same-origin API via Caddy on :80)
COPY local-frontend .
ARG VITE_LOCAL_SERVER_URL=
ARG VITE_ACCESS_SERVICE_URL=
ENV VITE_LOCAL_SERVER_URL=$VITE_LOCAL_SERVER_URL
ENV VITE_ACCESS_SERVICE_URL=$VITE_ACCESS_SERVICE_URL
RUN pnpm build

# ── Final: Caddy + built assets ───────────────────────────────────────────────
FROM caddy:2-alpine
COPY --from=frontend-builder /app/dist /srv
COPY caddy/Caddyfile /etc/caddy/Caddyfile
