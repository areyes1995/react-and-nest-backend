# =========================================================
# Uapaverse Backend — imagen de producción (NestJS + Prisma)
# =========================================================
FROM node:22-slim AS base

WORKDIR /app

# pnpm exacto del proyecto (packageManager: pnpm@10.2.0)
RUN corepack enable && corepack prepare pnpm@10.2.0 --activate

# =========================================================
# Dependencies
# =========================================================
FROM base AS deps

# Solo manifiestos para aprovechar la caché de Docker
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# =========================================================
# Builder
# =========================================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/prisma ./prisma

COPY . .

ENV NODE_ENV=production

# Cliente Prisma + compilación NestJS (./dist)
RUN pnpm prisma generate
RUN pnpm build
RUN pnpm prune --prod

# =========================================================
# Production image
# =========================================================
FROM node:22-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# openssl lo requiere Prisma en runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.2.0 --activate

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD curl -f http://localhost:$PORT/api/v1/health || exit 1

# 1️⃣ Regenera el cliente Prisma (idempotente)
# 2️⃣ Aplica migraciones pendientes (no-op si no hay)
# 3️⃣ Launch the compiled NestJS entry point (nest build → dist/src)
CMD ["sh", "-c", "pnpm prisma generate && pnpm prisma migrate deploy && node dist/src/main.js"]
