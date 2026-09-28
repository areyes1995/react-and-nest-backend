#!/bin/sh
# Uapaverse Backend — entrypoint de desarrollo (Docker).
# Instala deps, genera el cliente Prisma, aplica migraciones,
# corre seeders (si RUN_SEEDERS=true) y arranca Nest con hot reload.
#
# Variables opcionales:
#   RUN_SEEDERS=true            → ejecuta `pnpm run db:seed` (idempotente)
#   PRISMA_ROLLBACK_FAILED="m1 m2" → marca migraciones fallidas como
#     rolled-back antes del deploy (reparación P3009, solo dev).
set -e

apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

corepack enable
corepack prepare pnpm@10.2.0 --activate

pnpm install --frozen-lockfile
pnpm prisma generate

if [ -f scripts/ensure-pgvector.js ]; then
  echo "==> Asegurando pgvector…"
  node scripts/ensure-pgvector.js || echo "⚠️ ensure-pgvector falló"
elif [ -f scripts/ensure-pgvector.sh ]; then
  echo "==> Asegurando pgvector…"
  sh scripts/ensure-pgvector.sh || echo "⚠️ ensure-pgvector falló"
else
  PGPASSWORD="${DATABASE_PASSWORD:-postgres}" psql -h postgres -U "${DATABASE_USER:-postgres}" -d "${DATABASE_NAME:-uapaverse}" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1 || true
fi

if [ -n "$PRISMA_ROLLBACK_FAILED" ]; then
  for m in $PRISMA_ROLLBACK_FAILED; do
    echo "==> Marcando migracion fallida como rolled-back: $m"
    pnpm prisma migrate resolve --rolled-back "$m" || true
  done
fi

pnpm prisma migrate deploy

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  echo "==> Ejecutando seeders (RUN_SEEDERS=true)…"
  pnpm run db:seed
fi

echo "==> Arrancando API con hot reload (ts-node-dev --poll)…"
exec pnpm run start:dev
