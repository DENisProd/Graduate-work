# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
RUN corepack enable pnpm 2>/dev/null || true && \
  (pnpm install --frozen-lockfile 2>/dev/null || npm ci 2>/dev/null || npm install)

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
RUN npx prisma generate

EXPOSE 8085

# Run migrations if DATABASE_URL/ACCESS_CONTROL_DB_URL set, then start app
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || true; exec node dist/main.js"]
