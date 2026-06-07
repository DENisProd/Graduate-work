# ── deps ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── builder ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
# Pass them as build args in docker-compose (see docker-compose.yml).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ACCESS_API_URL
ARG NEXT_PUBLIC_PHYSICAL_DEVICES_API_URL
ARG NEXT_PUBLIC_USE_MOCKS=false

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_ACCESS_API_URL=$NEXT_PUBLIC_ACCESS_API_URL \
    NEXT_PUBLIC_PHYSICAL_DEVICES_API_URL=$NEXT_PUBLIC_PHYSICAL_DEVICES_API_URL \
    NEXT_PUBLIC_USE_MOCKS=$NEXT_PUBLIC_USE_MOCKS \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
